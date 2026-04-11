import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const MessagingContext = createContext(null);
const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(
  /\/api\/?$/,
  ""
);
const RTC_CONFIGURATION = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
};

const sortByNewest = (items) =>
  [...items].sort(
    (first, second) =>
      new Date(second.lastMessageAt || second.updatedAt || second.createdAt).getTime() -
      new Date(first.lastMessageAt || first.updatedAt || first.createdAt).getTime()
  );

const mergeConversation = (items, nextItem) => {
  const current = items.find((item) => item._id === nextItem._id);
  const merged = current
    ? {
        ...current,
        ...nextItem,
        partner: {
          ...current.partner,
          ...nextItem.partner
        }
      }
    : nextItem;

  return sortByNewest([merged, ...items.filter((item) => item._id !== nextItem._id)]);
};

const mergeMessages = (currentMessages = [], incomingMessages = []) => {
  const messageMap = new Map(currentMessages.map((message) => [message._id, message]));

  incomingMessages.forEach((message) => {
    messageMap.set(message._id, {
      ...(messageMap.get(message._id) || {}),
      ...message
    });
  });

  return [...messageMap.values()].sort((first, second) => {
    const timeDelta = new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
    if (timeDelta !== 0) return timeDelta;
    return first._id.localeCompare(second._id);
  });
};

const clearUnreadForConversation = (items, conversationId) =>
  items.map((item) =>
    item._id === conversationId
      ? {
          ...item,
          unreadCount: 0
        }
      : item
  );

const applyPresenceUpdate = (items, payload) =>
  items.map((item) =>
    item.partner?._id === payload.actorId && item.partner?.role === payload.actorRole
      ? {
          ...item,
          partner: {
            ...item.partner,
            online: payload.isOnline
          }
        }
      : item
  );

const applyMessageStateUpdate = (messages, payload) => {
  const messageIds = new Set(payload.messageIds || []);
  const messageStatesById = new Map(
    (payload.messageStates || []).map((item) => [item._id, item])
  );

  return messages.map((message) => {
    const nextState = messageStatesById.get(message._id);
    const shouldUpdate = nextState || messageIds.has(message._id);

    if (!shouldUpdate) return message;

    return {
      ...message,
      status: nextState?.status || payload.status,
      deliveredAt: nextState?.deliveredAt || payload.deliveredAt || message.deliveredAt,
      readAt: nextState?.readAt || payload.readAt || message.readAt
    };
  });
};

const getTotalUnread = (conversations) =>
  conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0);

const stopMediaStream = (stream) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
};

const createCallState = ({
  callId,
  conversationId,
  callType,
  direction,
  participant,
  status,
  localStream = null,
  remoteStream = null,
  isMuted = false,
  isCameraEnabled = callType === "video"
}) => ({
  callId,
  conversationId,
  callType,
  direction,
  participant,
  status,
  localStream,
  remoteStream,
  isMuted,
  isCameraEnabled
});

export const MessagingProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [nextCursorByConversation, setNextCursorByConversation] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessagesByConversation, setLoadingMessagesByConversation] = useState({});
  const [sendingConversationId, setSendingConversationId] = useState("");
  const [uploadingConversationId, setUploadingConversationId] = useState("");
  const [uploadProgressByConversation, setUploadProgressByConversation] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [callErrorMessage, setCallErrorMessage] = useState("");
  const [currentCall, setCurrentCall] = useState(null);
  const socketRef = useRef(null);
  const drawerOpenRef = useRef(false);
  const activeConversationIdRef = useRef("");
  const messagesRef = useRef({});
  const loadingMessagesRef = useRef({});
  const nextCursorRef = useRef({});
  const readInFlightRef = useRef(new Set());
  const currentCallRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  const messagingEnabled = Boolean(
    isAuthenticated && token && user && ["USER", "COMPANY"].includes(user.role)
  );

  useEffect(() => {
    drawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    messagesRef.current = messagesByConversation;
  }, [messagesByConversation]);

  useEffect(() => {
    loadingMessagesRef.current = loadingMessagesByConversation;
  }, [loadingMessagesByConversation]);

  useEffect(() => {
    nextCursorRef.current = nextCursorByConversation;
  }, [nextCursorByConversation]);

  useEffect(() => {
    currentCallRef.current = currentCall;
  }, [currentCall]);

  const updateCurrentCall = useCallback((updater) => {
    setCurrentCall((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      currentCallRef.current = next;
      return next;
    });
  }, []);

  const emitSocketEvent = useCallback((eventName, payload) => {
    const socket = socketRef.current;

    if (!socket) {
      return Promise.reject(new Error("Live connection is not available"));
    }

    return new Promise((resolve, reject) => {
      socket.emit(eventName, payload, (response) => {
        if (response?.ok) {
          resolve(response);
          return;
        }

        reject(new Error(response?.message || `Unable to process ${eventName}`));
      });
    });
  }, []);

  const destroyPeerConnection = useCallback(() => {
    pendingIceCandidatesRef.current = [];

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteStreamRef.current) {
      stopMediaStream(remoteStreamRef.current);
      remoteStreamRef.current = null;
    }
  }, []);

  const teardownCall = useCallback(() => {
    destroyPeerConnection();
    stopMediaStream(localStreamRef.current);
    stopMediaStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    updateCurrentCall(null);
  }, [destroyPeerConnection, updateCurrentCall]);

  const flushPendingIceCandidates = useCallback(async () => {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection?.remoteDescription?.type || !pendingIceCandidatesRef.current.length) {
      return;
    }

    const queuedCandidates = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    await Promise.all(
      queuedCandidates.map((candidate) =>
        peerConnection.addIceCandidate(candidate).catch(() => null)
      )
    );
  }, []);

  const createPeerConnection = useCallback(
    (callSnapshot) => {
      if (peerConnectionRef.current) return peerConnectionRef.current;

      const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
      const remoteStream = new MediaStream();

      remoteStreamRef.current = remoteStream;

      updateCurrentCall((current) =>
        current && current.callId === callSnapshot.callId
          ? {
              ...current,
              remoteStream
            }
          : current
      );

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current);
        });
      }

      peerConnection.ontrack = (event) => {
        event.streams.forEach((stream) => {
          stream.getTracks().forEach((track) => {
            const exists = remoteStream.getTracks().some((item) => item.id === track.id);
            if (!exists) {
              remoteStream.addTrack(track);
            }
          });
        });

        updateCurrentCall((current) =>
          current && current.callId === callSnapshot.callId
            ? {
                ...current,
                remoteStream,
                status: "connected"
              }
            : current
        );
      };

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) return;

        emitSocketEvent("call:signal", {
          callId: callSnapshot.callId,
          signalType: "ice-candidate",
          signalData: event.candidate.toJSON()
        }).catch(() => null);
      };

      peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === "connected") {
          updateCurrentCall((current) =>
            current && current.callId === callSnapshot.callId
              ? {
                  ...current,
                  status: "connected"
                }
              : current
          );
          return;
        }

        if (["failed", "closed"].includes(peerConnection.connectionState)) {
          setCallErrorMessage("Call ended");
          teardownCall();
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    },
    [emitSocketEvent, teardownCall, updateCurrentCall]
  );

  const requestCallMedia = useCallback(async (callType) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Your browser does not support calling");
    }

    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: callType === "video"
    });
  }, []);

  const handleIncomingSignal = useCallback(
    async ({ callId, signalType, signalData }) => {
      const callSnapshot = currentCallRef.current;

      if (!callSnapshot || callSnapshot.callId !== callId) return;

      if (signalType === "offer") {
        const peerConnection = createPeerConnection(callSnapshot);
        await peerConnection.setRemoteDescription(signalData);
        await flushPendingIceCandidates();

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await emitSocketEvent("call:signal", {
          callId,
          signalType: "answer",
          signalData: answer
        });

        updateCurrentCall((current) =>
          current && current.callId === callId
            ? {
                ...current,
                status: "connecting"
              }
            : current
        );
        return;
      }

      if (signalType === "answer") {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(signalData);
        await flushPendingIceCandidates();
        return;
      }

      if (signalType === "ice-candidate") {
        const candidate = new RTCIceCandidate(signalData);

        if (peerConnectionRef.current?.remoteDescription?.type) {
          await peerConnectionRef.current.addIceCandidate(candidate).catch(() => null);
        } else {
          pendingIceCandidatesRef.current.push(candidate);
        }
      }
    },
    [createPeerConnection, emitSocketEvent, flushPendingIceCandidates, updateCurrentCall]
  );

  const resetMessagingState = useCallback(() => {
    setIsDrawerOpen(false);
    setConversations([]);
    setActiveConversationId("");
    setMessagesByConversation({});
    setNextCursorByConversation({});
    setLoadingConversations(false);
    setLoadingMessagesByConversation({});
    setSendingConversationId("");
    setUploadingConversationId("");
    setUploadProgressByConversation({});
    setErrorMessage("");
    setCallErrorMessage("");
    readInFlightRef.current.clear();
    teardownCall();
  }, [teardownCall]);

  const fetchConversationList = useCallback(async () => {
    if (!messagingEnabled) return;

    setLoadingConversations(true);

    try {
      const { data } = await api.get("/messages/conversations");
      const nextConversations = sortByNewest(data.conversations || []);

      setConversations(nextConversations);
      setErrorMessage("");

      setActiveConversationId((current) => {
        if (current && nextConversations.some((conversation) => conversation._id === current)) {
          return current;
        }

        return nextConversations[0]?._id || "";
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load conversations");
      setConversations([]);
      setActiveConversationId("");
    } finally {
      setLoadingConversations(false);
    }
  }, [messagingEnabled]);

  const loadConversationMessages = useCallback(async (conversationId, options = {}) => {
    if (!conversationId || !messagingEnabled) return [];

    const hasLoadedMessages = Boolean(messagesRef.current[conversationId]?.length);
    const isLoading = Boolean(loadingMessagesRef.current[conversationId]);

    if (isLoading || (hasLoadedMessages && !options.force)) {
      return messagesRef.current[conversationId] || [];
    }

    setLoadingMessagesByConversation((current) => ({
      ...current,
      [conversationId]: true
    }));

    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}/messages`, {
        params: { limit: 20 }
      });

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: mergeMessages(current[conversationId] || [], data.messages || [])
      }));
      setNextCursorByConversation((current) => ({
        ...current,
        [conversationId]: data.nextCursor || null
      }));
      setErrorMessage("");
      return data.messages || [];
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load messages");
      return [];
    } finally {
      setLoadingMessagesByConversation((current) => ({
        ...current,
        [conversationId]: false
      }));
    }
  }, [messagingEnabled]);

  const loadOlderMessages = useCallback(async (conversationId) => {
    const cursor = nextCursorRef.current[conversationId];

    if (!conversationId || !cursor || !messagingEnabled || loadingMessagesRef.current[conversationId]) {
      return [];
    }

    setLoadingMessagesByConversation((current) => ({
      ...current,
      [conversationId]: true
    }));

    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}/messages`, {
        params: {
          limit: 20,
          cursor
        }
      });

      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: mergeMessages(data.messages || [], current[conversationId] || [])
      }));
      setNextCursorByConversation((current) => ({
        ...current,
        [conversationId]: data.nextCursor || null
      }));
      return data.messages || [];
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to load older messages");
      return [];
    } finally {
      setLoadingMessagesByConversation((current) => ({
        ...current,
        [conversationId]: false
      }));
    }
  }, [messagingEnabled]);

  const markConversationAsRead = useCallback(async (conversationId) => {
    if (!conversationId || !messagingEnabled || readInFlightRef.current.has(conversationId)) {
      return;
    }

    readInFlightRef.current.add(conversationId);
    setConversations((current) => clearUnreadForConversation(current, conversationId));

    try {
      await api.post(`/messages/conversations/${conversationId}/read`);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Unable to update read receipts");
    } finally {
      readInFlightRef.current.delete(conversationId);
    }
  }, [messagingEnabled]);

  const openConversation = useCallback((conversationId) => {
    if (!conversationId) return;
    setIsDrawerOpen(true);
    setActiveConversationId(conversationId);
  }, []);

  const openInbox = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const closeInbox = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const ensureConversation = useCallback(
    async (payload) => {
      if (!messagingEnabled) return null;

      const { data } = await api.post("/messages/conversations", payload);
      const nextConversation = data.conversation;

      setConversations((current) => mergeConversation(current, nextConversation));
      setErrorMessage("");
      openConversation(nextConversation._id);

      return nextConversation;
    },
    [messagingEnabled, openConversation]
  );

  const uploadConversationMedia = useCallback(
    async (conversationId, file) => {
      if (!conversationId || !file || !messagingEnabled) return null;

      setUploadingConversationId(conversationId);
      setUploadProgressByConversation((current) => ({
        ...current,
        [conversationId]: 0
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);

        const { data } = await api.post(
          `/messages/conversations/${conversationId}/media`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data"
            },
            onUploadProgress: (event) => {
              if (!event.total) return;
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgressByConversation((current) => ({
                ...current,
                [conversationId]: progress
              }));
            }
          }
        );

        setErrorMessage("");
        return data.media;
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to upload media");
        throw error;
      } finally {
        setUploadingConversationId("");
        setUploadProgressByConversation((current) => ({
          ...current,
          [conversationId]: 0
        }));
      }
    },
    [messagingEnabled]
  );

  const sendMessage = useCallback(
    async (conversationId, input) => {
      if (!messagingEnabled || !conversationId) return null;

      const payload =
        typeof input === "string"
          ? { messageText: input }
          : {
              messageText: input?.messageText || "",
              mediaUrl: input?.mediaUrl || input?.media?.mediaUrl || "",
              mediaType: input?.mediaType || input?.media?.mediaType || "",
              mediaName: input?.mediaName || input?.media?.mediaName || "",
              mediaSize: input?.mediaSize || input?.media?.mediaSize || 0
            };

      if (!payload.messageText.trim() && !payload.mediaUrl) return null;

      setSendingConversationId(conversationId);

      try {
        const { data } = await api.post(`/messages/conversations/${conversationId}/messages`, payload);

        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: mergeMessages(current[conversationId] || [], [data.message])
        }));
        setErrorMessage("");
        return data.message;
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Unable to send message");
        throw error;
      } finally {
        setSendingConversationId("");
      }
    },
    [messagingEnabled]
  );

  const startCall = useCallback(
    async (conversationId, callType) => {
      if (
        !conversationId ||
        !["voice", "video"].includes(callType) ||
        !messagingEnabled ||
        currentCallRef.current
      ) {
        return null;
      }

      openConversation(conversationId);
      setCallErrorMessage("");

      try {
        const localStream = await requestCallMedia(callType);
        localStreamRef.current = localStream;

        const response = await emitSocketEvent("call:initiate", {
          conversationId,
          callType
        });

        updateCurrentCall(
          createCallState({
            callId: response.callId,
            conversationId,
            callType,
            direction: "outgoing",
            participant:
              response.to ||
              conversations.find((item) => item._id === conversationId)?.partner ||
              null,
            status: "calling",
            localStream
          })
        );

        return response;
      } catch (error) {
        stopMediaStream(localStreamRef.current);
        localStreamRef.current = null;
        setCallErrorMessage(error.message || "Unable to start the call");
        throw error;
      }
    },
    [
      conversations,
      emitSocketEvent,
      messagingEnabled,
      openConversation,
      requestCallMedia,
      updateCurrentCall
    ]
  );

  const acceptIncomingCall = useCallback(async () => {
    const callSnapshot = currentCallRef.current;

    if (!callSnapshot || callSnapshot.status !== "incoming") return;

    openConversation(callSnapshot.conversationId);
    setCallErrorMessage("");

    try {
      const localStream = await requestCallMedia(callSnapshot.callType);
      localStreamRef.current = localStream;

      updateCurrentCall((current) =>
        current && current.callId === callSnapshot.callId
          ? {
              ...current,
              localStream,
              status: "connecting"
            }
          : current
      );

      createPeerConnection({
        callId: callSnapshot.callId,
        conversationId: callSnapshot.conversationId
      });

      await emitSocketEvent("call:accept", {
        callId: callSnapshot.callId
      });
    } catch (error) {
      setCallErrorMessage(error.message || "Unable to answer the call");
      teardownCall();
    }
  }, [
    createPeerConnection,
    emitSocketEvent,
    openConversation,
    requestCallMedia,
    teardownCall,
    updateCurrentCall
  ]);

  const rejectIncomingCall = useCallback(async () => {
    const callSnapshot = currentCallRef.current;
    if (!callSnapshot) return;

    try {
      await emitSocketEvent("call:reject", {
        callId: callSnapshot.callId
      });
    } catch (_error) {
      // local teardown should still happen
    } finally {
      teardownCall();
    }
  }, [emitSocketEvent, teardownCall]);

  const endCall = useCallback(
    async (reason = "ended") => {
      const callSnapshot = currentCallRef.current;
      if (!callSnapshot) return;

      try {
        await emitSocketEvent("call:end", {
          callId: callSnapshot.callId,
          reason
        });
      } catch (_error) {
        // local cleanup should still happen
      } finally {
        teardownCall();
      }
    },
    [emitSocketEvent, teardownCall]
  );

  const toggleMute = useCallback(() => {
    updateCurrentCall((current) => {
      if (!current) return current;

      const nextMuted = !current.isMuted;
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });

      return {
        ...current,
        isMuted: nextMuted
      };
    });
  }, [updateCurrentCall]);

  const toggleCamera = useCallback(() => {
    updateCurrentCall((current) => {
      if (!current || current.callType !== "video") return current;

      const videoTracks = localStreamRef.current?.getVideoTracks() || [];
      if (!videoTracks.length) return current;

      const nextEnabled = !current.isCameraEnabled;
      videoTracks.forEach((track) => {
        track.enabled = nextEnabled;
      });

      return {
        ...current,
        isCameraEnabled: nextEnabled
      };
    });
  }, [updateCurrentCall]);

  const clearCallError = useCallback(() => {
    setCallErrorMessage("");
  }, []);

  useEffect(() => {
    if (!messagingEnabled) {
      resetMessagingState();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    fetchConversationList().catch(() => null);
  }, [fetchConversationList, messagingEnabled, resetMessagingState]);

  useEffect(() => {
    if (!messagingEnabled) return undefined;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"]
    });

    socketRef.current = socket;

    socket.on("conversation:upsert", (conversation) => {
      setConversations((current) => mergeConversation(current, conversation));
    });

    socket.on("message:new", (message) => {
      setMessagesByConversation((current) => ({
        ...current,
        [message.conversationId]: mergeMessages(current[message.conversationId] || [], [message])
      }));

      if (
        !message.isOwnMessage &&
        drawerOpenRef.current &&
        activeConversationIdRef.current === message.conversationId
      ) {
        markConversationAsRead(message.conversationId).catch(() => null);
      }
    });

    socket.on("messages:updated", (payload) => {
      setMessagesByConversation((current) => ({
        ...current,
        [payload.conversationId]: applyMessageStateUpdate(
          current[payload.conversationId] || [],
          payload
        )
      }));
    });

    socket.on("presence:update", (payload) => {
      setConversations((current) => applyPresenceUpdate(current, payload));
    });

    socket.on("call:incoming", (payload) => {
      if (currentCallRef.current) {
        socket.emit("call:reject", { callId: payload.callId });
        return;
      }

      setCallErrorMessage("");
      updateCurrentCall(
        createCallState({
          callId: payload.callId,
          conversationId: payload.conversationId,
          callType: payload.callType,
          direction: "incoming",
          participant: payload.from,
          status: "incoming"
        })
      );
    });

    socket.on("call:accepted", (payload) => {
      const callSnapshot = currentCallRef.current;

      if (!callSnapshot || callSnapshot.callId !== payload.callId) return;

      updateCurrentCall((current) =>
        current && current.callId === payload.callId
          ? {
              ...current,
              status: "connecting"
            }
          : current
      );

      if (callSnapshot.direction !== "outgoing") return;

      (async () => {
        try {
          const peerConnection = createPeerConnection(callSnapshot);
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          await emitSocketEvent("call:signal", {
            callId: payload.callId,
            signalType: "offer",
            signalData: offer
          });
        } catch (error) {
          setCallErrorMessage(error.message || "Unable to connect the call");
          teardownCall();
        }
      })().catch(() => null);
    });

    socket.on("call:signal", (payload) => {
      handleIncomingSignal(payload).catch((error) => {
        setCallErrorMessage(error.message || "Call signaling failed");
        teardownCall();
      });
    });

    socket.on("call:rejected", (payload) => {
      if (currentCallRef.current?.callId !== payload.callId) return;
      setCallErrorMessage("Call declined");
      teardownCall();
    });

    socket.on("call:ended", (payload) => {
      if (currentCallRef.current?.callId !== payload.callId) return;
      setCallErrorMessage(payload.reason === "disconnected" ? "Call disconnected" : "Call ended");
      teardownCall();
    });

    socket.on("disconnect", () => {
      if (!currentCallRef.current) return;
      setCallErrorMessage("Connection lost");
      teardownCall();
    });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [
    createPeerConnection,
    emitSocketEvent,
    handleIncomingSignal,
    markConversationAsRead,
    messagingEnabled,
    teardownCall,
    token,
    updateCurrentCall
  ]);

  useEffect(() => {
    if (!isDrawerOpen || !messagingEnabled) return;

    if (!activeConversationId && conversations[0]?._id) {
      setActiveConversationId(conversations[0]._id);
      return;
    }

    if (!activeConversationId) return;

    loadConversationMessages(activeConversationId).catch(() => null);
    markConversationAsRead(activeConversationId).catch(() => null);
  }, [
    activeConversationId,
    conversations,
    isDrawerOpen,
    loadConversationMessages,
    markConversationAsRead,
    messagingEnabled
  ]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeConversationId) || null,
    [activeConversationId, conversations]
  );

  const activeMessages = useMemo(
    () => messagesByConversation[activeConversationId] || [],
    [activeConversationId, messagesByConversation]
  );

  const value = useMemo(
    () => ({
      messagingEnabled,
      isDrawerOpen,
      conversations,
      totalUnreadCount: getTotalUnread(conversations),
      activeConversationId,
      activeConversation,
      activeMessages,
      hasOlderMessages: Boolean(nextCursorByConversation[activeConversationId]),
      loadingConversations,
      loadingMessages: Boolean(loadingMessagesByConversation[activeConversationId]),
      sendingMessage: sendingConversationId === activeConversationId,
      uploadingMedia: uploadingConversationId === activeConversationId,
      uploadProgress: uploadProgressByConversation[activeConversationId] || 0,
      errorMessage,
      currentCall,
      callErrorMessage,
      openInbox,
      closeInbox,
      openConversation,
      ensureConversation,
      loadOlderMessages,
      uploadConversationMedia,
      sendMessage,
      startCall,
      acceptIncomingCall,
      rejectIncomingCall,
      endCall,
      toggleMute,
      toggleCamera,
      clearCallError
    }),
    [
      acceptIncomingCall,
      activeConversation,
      activeConversationId,
      activeMessages,
      callErrorMessage,
      conversations,
      currentCall,
      endCall,
      ensureConversation,
      errorMessage,
      isDrawerOpen,
      loadOlderMessages,
      loadingConversations,
      loadingMessagesByConversation,
      messagingEnabled,
      nextCursorByConversation,
      openConversation,
      openInbox,
      closeInbox,
      rejectIncomingCall,
      sendMessage,
      sendingConversationId,
      startCall,
      clearCallError,
      toggleCamera,
      toggleMute,
      uploadConversationMedia,
      uploadingConversationId,
      uploadProgressByConversation
    ]
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used inside MessagingProvider");
  }
  return context;
};
