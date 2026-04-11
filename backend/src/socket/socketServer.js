import { createServer } from "http";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import {
  buildConversationItem,
  getConversationActors,
  getConversationPartnerActor,
  getConversationAccessQuery,
  hydrateConversation,
  resolveActorFromUser
} from "../services/messagingService.js";

let io;

const onlineActors = new Map();
const callSessions = new Map();

const toActorKey = (role, entityId) => `${role}:${String(entityId)}`;
const getRoomName = (role, entityId) => `actor:${toActorKey(role, entityId)}`;
const createAck = (callback) => (typeof callback === "function" ? callback : () => {});

const buildCallParticipant = (conversation, viewerActor, options = {}) =>
  buildConversationItem(conversation, viewerActor, options).partner;

const getCallSession = (callId, actor) => {
  const session = callSessions.get(String(callId));

  if (!session) {
    const error = new Error("Call session not found");
    error.statusCode = 404;
    throw error;
  }

  const actorKey = toActorKey(actor.role, actor.entityId);
  if (session.callerKey !== actorKey && session.calleeKey !== actorKey) {
    const error = new Error("You do not have access to this call session");
    error.statusCode = 403;
    throw error;
  }

  return session;
};

const addActorConnection = (actor, socketId) => {
  const actorKey = toActorKey(actor.role, actor.entityId);
  const currentSockets = onlineActors.get(actorKey) || new Set();
  const wasOffline = currentSockets.size === 0;
  currentSockets.add(socketId);
  onlineActors.set(actorKey, currentSockets);
  return wasOffline;
};

const removeActorConnection = (actor, socketId) => {
  const actorKey = toActorKey(actor.role, actor.entityId);
  const currentSockets = onlineActors.get(actorKey);
  if (!currentSockets) return false;

  currentSockets.delete(socketId);

  if (currentSockets.size === 0) {
    onlineActors.delete(actorKey);
    return true;
  }

  onlineActors.set(actorKey, currentSockets);
  return false;
};

export const isActorOnline = (actor) => onlineActors.has(toActorKey(actor.role, actor.entityId));

export const createHttpServer = (app) => createServer(app);

export const emitToActor = (actor, event, payload) => {
  if (!io) return;
  io.to(getRoomName(actor.role, actor.entityId)).emit(event, payload);
};

export const emitUnreadTotal = async (actor) => {
  const [summary] = await Conversation.aggregate([
    { $match: getConversationAccessQuery(actor) },
    {
      $group: {
        _id: null,
        totalUnreadCount: {
          $sum: actor.unreadKey === "user" ? "$unreadCounts.user" : "$unreadCounts.company"
        }
      }
    }
  ]);

  emitToActor(actor, "inbox:unread", {
    totalUnreadCount: summary?.totalUnreadCount || 0
  });
};

export const emitMessagesUpdated = async (actorTargets, payload) => {
  actorTargets.forEach((actor) => emitToActor(actor, "messages:updated", payload));
};

export const emitConversationUpsert = async (conversation) => {
  const actors = getConversationActors(conversation);
  const userPartner = getConversationPartnerActor(conversation, actors.user);
  const companyPartner = getConversationPartnerActor(conversation, actors.company);

  emitToActor(
    actors.user,
    "conversation:upsert",
    buildConversationItem(conversation, actors.user, {
      isPartnerOnline: isActorOnline(userPartner)
    })
  );

  emitToActor(
    actors.company,
    "conversation:upsert",
    buildConversationItem(conversation, actors.company, {
      isPartnerOnline: isActorOnline(companyPartner)
    })
  );

  await Promise.all([emitUnreadTotal(actors.user), emitUnreadTotal(actors.company)]);
};

const emitPresenceState = async (actor, isOnline) => {
  const conversations = await Conversation.find(getConversationAccessQuery(actor))
    .select("user company")
    .lean();

  conversations.forEach((conversation) => {
    const partner = getConversationPartnerActor(conversation, actor);
    emitToActor(partner, "presence:update", {
      actorId: actor.entityId,
      actorRole: actor.role,
      isOnline
    });
  });
};

const markPendingMessagesDelivered = async (actor) => {
  const pendingMessages = await Message.find({
    receiverId: actor.entityObjectId,
    receiverRole: actor.role,
    status: "sent"
  })
    .select("_id conversation senderId senderRole")
    .sort({ createdAt: 1, _id: 1 })
    .lean();

  if (!pendingMessages.length) return;

  const deliveredAt = new Date();

  await Message.updateMany(
    { _id: { $in: pendingMessages.map((message) => message._id) } },
    {
      $set: {
        status: "delivered",
        deliveredAt
      }
    }
  );

  const groupedPayloads = pendingMessages.reduce((acc, message) => {
    const key = String(message.conversation);
    if (!acc[key]) {
      acc[key] = {
        conversationId: key,
        messageIds: [],
        senderActor: {
          role: message.senderRole,
          entityId: String(message.senderId)
        }
      };
    }

    acc[key].messageIds.push(String(message._id));
    return acc;
  }, {});

  Object.values(groupedPayloads).forEach((group) => {
    const payload = {
      conversationId: group.conversationId,
      messageIds: group.messageIds,
      status: "delivered",
      deliveredAt
    };

    emitToActor(group.senderActor, "messages:updated", payload);
    emitToActor(actor, "messages:updated", payload);
  });
};

const handleActiveCallsDisconnect = (actor) => {
  const actorKey = toActorKey(actor.role, actor.entityId);

  Array.from(callSessions.values()).forEach((session) => {
    if (session.callerKey !== actorKey && session.calleeKey !== actorKey) return;

    const otherActor = session.callerKey === actorKey ? session.calleeActor : session.callerActor;

    emitToActor(otherActor, "call:ended", {
      callId: session.callId,
      conversationId: session.conversationId,
      reason: "disconnected"
    });

    callSessions.delete(session.callId);
  });
};

export const initializeSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.user = user;
      socket.data.actor = resolveActorFromUser(user);
      next();
    } catch (error) {
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const actor = socket.data.actor;

    socket.join(getRoomName(actor.role, actor.entityId));

    const becameOnline = addActorConnection(actor, socket.id);

    try {
      await markPendingMessagesDelivered(actor);

      if (becameOnline) {
        await emitPresenceState(actor, true);
      }
    } catch (error) {
      console.error("Socket connection side effects failed", error);
    }

    socket.on("disconnect", async () => {
      handleActiveCallsDisconnect(actor);
      const becameOffline = removeActorConnection(actor, socket.id);

      if (!becameOffline) return;

      try {
        await emitPresenceState(actor, false);
      } catch (error) {
        console.error("Presence update on disconnect failed", error);
      }
    });

    socket.on("call:initiate", async (payload, callback) => {
      const respond = createAck(callback);

      try {
        const { conversationId, callType } = payload || {};
        if (!conversationId || !["voice", "video"].includes(callType)) {
          throw new Error("Valid conversationId and callType are required");
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          const error = new Error("Conversation not found");
          error.statusCode = 404;
          throw error;
        }

        const callerIsUser =
          actor.role === "USER" && String(conversation.user) === String(actor.entityId);
        const callerIsCompany =
          actor.role === "COMPANY" && String(conversation.company) === String(actor.entityId);

        if (!callerIsUser && !callerIsCompany) {
          const error = new Error("You do not have access to this conversation");
          error.statusCode = 403;
          throw error;
        }

        const hydratedConversation = await hydrateConversation(conversationId);
        const receiver = getConversationPartnerActor(hydratedConversation, actor);

        if (!isActorOnline(receiver)) {
          const error = new Error("The other participant is offline right now");
          error.statusCode = 409;
          throw error;
        }

        const callId = randomUUID();
        const receiverView = buildCallParticipant(hydratedConversation, receiver, {
          isPartnerOnline: true
        });
        const callerView = buildCallParticipant(hydratedConversation, actor, {
          isPartnerOnline: true
        });

        callSessions.set(callId, {
          callId,
          conversationId: String(conversationId),
          callType,
          callerActor: actor,
          calleeActor: receiver,
          callerKey: toActorKey(actor.role, actor.entityId),
          calleeKey: toActorKey(receiver.role, receiver.entityId)
        });

        emitToActor(receiver, "call:incoming", {
          callId,
          conversationId: String(conversationId),
          callType,
          from: receiverView
        });

        respond({
          ok: true,
          callId,
          conversationId: String(conversationId),
          callType,
          to: callerView
        });
      } catch (error) {
        respond({
          ok: false,
          message: error.message || "Unable to start the call"
        });
      }
    });

    socket.on("call:accept", async (payload, callback) => {
      const respond = createAck(callback);

      try {
        const session = getCallSession(payload?.callId, actor);
        const actorKey = toActorKey(actor.role, actor.entityId);

        if (session.calleeKey !== actorKey) {
          const error = new Error("Only the receiver can accept this call");
          error.statusCode = 403;
          throw error;
        }

        emitToActor(session.callerActor, "call:accepted", {
          callId: session.callId,
          conversationId: session.conversationId
        });
        emitToActor(session.calleeActor, "call:accepted", {
          callId: session.callId,
          conversationId: session.conversationId
        });

        respond({ ok: true });
      } catch (error) {
        respond({
          ok: false,
          message: error.message || "Unable to accept the call"
        });
      }
    });

    socket.on("call:reject", (payload, callback) => {
      const respond = createAck(callback);

      try {
        const session = getCallSession(payload?.callId, actor);
        const otherActor =
          session.callerKey === toActorKey(actor.role, actor.entityId)
            ? session.calleeActor
            : session.callerActor;

        emitToActor(otherActor, "call:rejected", {
          callId: session.callId,
          conversationId: session.conversationId
        });

        callSessions.delete(session.callId);
        respond({ ok: true });
      } catch (error) {
        respond({
          ok: false,
          message: error.message || "Unable to reject the call"
        });
      }
    });

    socket.on("call:end", (payload, callback) => {
      const respond = createAck(callback);

      try {
        const session = getCallSession(payload?.callId, actor);
        const otherActor =
          session.callerKey === toActorKey(actor.role, actor.entityId)
            ? session.calleeActor
            : session.callerActor;

        emitToActor(otherActor, "call:ended", {
          callId: session.callId,
          conversationId: session.conversationId,
          reason: payload?.reason || "ended"
        });

        callSessions.delete(session.callId);
        respond({ ok: true });
      } catch (error) {
        respond({
          ok: false,
          message: error.message || "Unable to end the call"
        });
      }
    });

    socket.on("call:signal", (payload, callback) => {
      const respond = createAck(callback);

      try {
        const session = getCallSession(payload?.callId, actor);

        if (!["offer", "answer", "ice-candidate"].includes(payload?.signalType)) {
          throw new Error("Unsupported signalType");
        }

        const otherActor =
          session.callerKey === toActorKey(actor.role, actor.entityId)
            ? session.calleeActor
            : session.callerActor;

        emitToActor(otherActor, "call:signal", {
          callId: session.callId,
          conversationId: session.conversationId,
          signalType: payload.signalType,
          signalData: payload.signalData
        });

        respond({ ok: true });
      } catch (error) {
        respond({
          ok: false,
          message: error.message || "Unable to relay call signal"
        });
      }
    });
  });

  return io;
};

export const getSocketServer = () => io;
