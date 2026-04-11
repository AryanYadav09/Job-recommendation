import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  ChevronLeft,
  Inbox,
  LoaderCircle,
  Paperclip,
  Phone,
  SendHorizontal,
  Video,
  X
} from "lucide-react";
import { useMessaging } from "../context/MessagingContext";
import ProfileIdentityLink from "./ProfileIdentityLink";
import {
  formatFileSize,
  formatRelativeTime,
  toAbsoluteAssetUrl
} from "../utils/format";

const formatConversationTimestamp = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();

  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : formatRelativeTime(value);
};

const formatMessageTimestamp = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
};

const MessageStatus = ({ status }) => {
  if (status === "read") {
    return <CheckCheck size={14} className="text-cyan-200" />;
  }

  if (status === "delivered") {
    return <CheckCheck size={14} className="text-white/80" />;
  }

  return <Check size={14} className="text-white/75" />;
};

const MessageMedia = ({ message, onPreviewImage }) => {
  if (!message.mediaUrl) return null;

  const mediaUrl = toAbsoluteAssetUrl(message.mediaUrl);

  if (message.mediaType === "image") {
    return (
      <button
        type="button"
        className="mb-3 block overflow-hidden rounded-[20px] border border-black/5"
        onClick={() => onPreviewImage(mediaUrl)}
      >
        <img
          src={mediaUrl}
          alt={message.mediaName || "Shared media"}
          className="max-h-[22rem] w-full object-cover"
          loading="lazy"
        />
      </button>
    );
  }

  if (message.mediaType === "video") {
    return (
      <div className="mb-3 overflow-hidden rounded-[20px] border border-black/5 bg-slate-950">
        <video controls preload="metadata" className="max-h-[22rem] w-full">
          <source src={mediaUrl} />
        </video>
      </div>
    );
  }

  return null;
};

const InboxDrawer = () => {
  const {
    messagingEnabled,
    isDrawerOpen,
    conversations,
    activeConversationId,
    activeConversation,
    activeMessages,
    hasOlderMessages,
    loadingConversations,
    loadingMessages,
    sendingMessage,
    uploadingMedia,
    uploadProgress,
    errorMessage,
    currentCall,
    closeInbox,
    openConversation,
    loadOlderMessages,
    uploadConversationMedia,
    sendMessage,
    startCall
  } = useMessaging();
  const [draft, setDraft] = useState("");
  const [composerError, setComposerError] = useState("");
  const [showMobileThread, setShowMobileThread] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const preserveScrollPositionRef = useRef(false);

  const resetComposer = () => {
    setDraft("");
    setComposerError("");
    setSelectedFile(null);
    setSelectedFilePreview("");
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      resetComposer();
      setShowMobileThread(false);
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    resetComposer();

    if (activeConversationId) {
      setShowMobileThread(true);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (!selectedFile) {
      setSelectedFilePreview("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setSelectedFilePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const nextCount = activeMessages.length;
    const previousCount = previousMessageCountRef.current;
    previousMessageCountRef.current = nextCount;

    if (preserveScrollPositionRef.current) {
      preserveScrollPositionRef.current = false;
      return;
    }

    if (nextCount <= previousCount) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, [activeMessages, activeConversationId]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [draft, activeConversationId]);

  const activeConversationLabel = useMemo(
    () => activeConversation?.partner?.name || "Conversation",
    [activeConversation]
  );

  const activeCallForConversation =
    currentCall && currentCall.conversationId === activeConversationId ? currentCall : null;

  if (!messagingEnabled || !isDrawerOpen) return null;

  const handleOpenConversation = (conversationId) => {
    if (!conversationId) return;
    resetComposer();
    openConversation(conversationId);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!activeConversationId || (!draft.trim() && !selectedFile)) return;

    try {
      let media = null;

      if (selectedFile) {
        media = await uploadConversationMedia(activeConversationId, selectedFile);
      }

      await sendMessage(activeConversationId, {
        messageText: draft,
        media
      });

      resetComposer();
    } catch (error) {
      setComposerError(error.response?.data?.message || "Unable to send message");
    }
  };

  const handleSelectFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png", "video/mp4", "video/webm"].includes(file.type)) {
      setComposerError("Only JPG, JPEG, PNG, MP4, and WEBM files are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setComposerError("Files must be 20MB or smaller");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setComposerError("");
    event.target.value = "";
  };

  const handleLoadOlder = async () => {
    const container = scrollContainerRef.current;
    const previousScrollHeight = container?.scrollHeight || 0;
    preserveScrollPositionRef.current = true;

    await loadOlderMessages(activeConversationId);

    if (!container) return;
    const newScrollHeight = container.scrollHeight;
    container.scrollTop += newScrollHeight - previousScrollHeight;
  };

  const handleTextareaKeyDown = async (event) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (!activeConversationId || (!draft.trim() && !selectedFile) || sendingMessage || uploadingMedia) {
      return;
    }

    await handleSend(event);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm">
      <button
        aria-label="Close inbox"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={closeInbox}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[60rem] flex-col border-l border-slate-200/70 bg-white/95 shadow-2xl dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70 dark:text-sky-300/70">
              Inbox
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white">
              Messages
            </h2>
          </div>

          <button className="btn-icon" onClick={closeInbox}>
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[20rem_minmax(0,1fr)]">
          <section
            className={`border-r border-slate-200/70 dark:border-slate-800 ${
              showMobileThread ? "hidden md:block" : "block"
            }`}
          >
            <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Recent conversations sorted by the latest message.
              </p>
            </div>

            <div className="no-scrollbar h-[calc(100vh-8.5rem)] overflow-y-auto px-3 py-3">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-10 text-sm text-slate-500 dark:text-slate-400">
                  <LoaderCircle size={16} className="mr-2 animate-spin" /> Loading inbox
                </div>
              ) : null}

              {!loadingConversations && !conversations.length ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
                  <Inbox className="mx-auto text-slate-400" size={26} />
                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Start one from an applicant card or an application you already sent.
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                {conversations.map((conversation) => {
                  const active = conversation._id === activeConversationId;

                  return (
                    <article
                      key={conversation._id}
                      className={`cursor-pointer rounded-[24px] border px-4 py-3 transition ${
                        active
                          ? "border-sky-200 bg-sky-50 shadow-sm dark:border-sky-900 dark:bg-sky-950/30"
                          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-700 dark:hover:bg-slate-900/60"
                      }`}
                      onClick={() => handleOpenConversation(conversation._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="relative">
                                {conversation.partner?.online ? (
                                  <span className="absolute bottom-0 left-9 z-10 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
                                ) : null}
                                <ProfileIdentityLink
                                  role={conversation.partner?.role}
                                  id={conversation.partner?._id}
                                  name={conversation.partner?.name}
                                  subtitle={conversation.partner?.subtitle}
                                  avatarUrl={conversation.partner?.logoUrl}
                                  disableNavigation
                                />
                              </div>
                            </div>
                            <span className="shrink-0 text-xs text-slate-400">
                              {formatConversationTimestamp(conversation.lastMessageAt)}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <p className="min-w-0 flex-1 truncate text-sm text-slate-600 dark:text-slate-300">
                              {conversation.lastMessagePreview}
                            </p>
                            {conversation.unreadCount ? (
                              <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                                {conversation.unreadCount > 10 ? "10+" : conversation.unreadCount}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={`${showMobileThread ? "block" : "hidden md:block"} flex min-h-0 flex-col`}>
            {activeConversation ? (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
                  <button
                    className="btn-icon md:hidden"
                    onClick={() => setShowMobileThread(false)}
                    aria-label="Back to conversation list"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <ProfileIdentityLink
                      role={activeConversation.partner?.role}
                      id={activeConversation.partner?._id}
                      name={activeConversationLabel}
                      subtitle={
                        activeConversation.partner?.online
                          ? "Online now"
                          : activeConversation.partner?.subtitle
                      }
                      avatarUrl={activeConversation.partner?.logoUrl}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="btn-icon"
                      onClick={() => startCall(activeConversationId, "voice").catch(() => null)}
                      disabled={Boolean(currentCall)}
                      aria-label="Start voice call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => startCall(activeConversationId, "video").catch(() => null)}
                      disabled={Boolean(currentCall)}
                      aria-label="Start video call"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>

                <div
                  ref={scrollContainerRef}
                  className="no-scrollbar flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_28%),linear-gradient(180deg,rgba(241,245,249,0.96),rgba(255,255,255,0.96))] px-4 py-4 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,0.98))]"
                >
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                    {activeCallForConversation ? (
                      <div className="mx-auto rounded-full border border-sky-200 bg-white/85 px-4 py-2 text-xs font-semibold text-sky-700 shadow-sm dark:border-sky-900 dark:bg-slate-900/85 dark:text-sky-300">
                        {activeCallForConversation.status === "incoming"
                          ? "Incoming call"
                          : activeCallForConversation.status === "connected"
                            ? "Call connected"
                            : activeCallForConversation.callType === "video"
                              ? "Video call in progress"
                              : "Voice call in progress"}
                      </div>
                    ) : null}

                    {hasOlderMessages ? (
                      <button
                        className="mx-auto rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={handleLoadOlder}
                        disabled={loadingMessages}
                      >
                        {loadingMessages ? "Loading..." : "Load older messages"}
                      </button>
                    ) : null}

                    {!activeMessages.length && !loadingMessages ? (
                      <div className="mx-auto max-w-md rounded-[26px] border border-dashed border-slate-200 bg-white/85 px-5 py-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          No messages yet
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Send the first message to start this conversation.
                        </p>
                      </div>
                    ) : null}

                    {activeMessages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[24px] px-4 py-3 shadow-sm md:max-w-[70%] ${
                            message.isOwnMessage
                              ? "rounded-br-md bg-gradient-to-br from-sky-500 to-blue-700 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <MessageMedia message={message} onPreviewImage={setImagePreviewUrl} />
                          {message.messageText ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-7">
                              {message.messageText}
                            </p>
                          ) : null}
                          <div
                            className={`mt-2 flex items-center justify-end gap-1 text-[11px] ${
                              message.isOwnMessage
                                ? "text-sky-100/90"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <span>{formatMessageTimestamp(message.createdAt)}</span>
                            {message.isOwnMessage ? <MessageStatus status={message.status} /> : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <form
                  onSubmit={handleSend}
                  className="border-t border-slate-200/80 bg-white/95 px-4 pb-5 pt-4 dark:border-slate-800 dark:bg-slate-950/95"
                >
                  <div className="mx-auto w-full max-w-3xl space-y-3">
                    {selectedFile ? (
                      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {selectedFile.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {selectedFile.type.startsWith("image/") ? "Image" : "Video"} |{" "}
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => setSelectedFile(null)}
                            aria-label="Remove attachment"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {selectedFilePreview ? (
                          selectedFile.type.startsWith("image/") ? (
                            <img
                              src={selectedFilePreview}
                              alt={selectedFile.name}
                              className="mt-3 max-h-48 rounded-[18px] object-cover"
                            />
                          ) : (
                            <video
                              controls
                              className="mt-3 max-h-48 rounded-[18px]"
                              src={selectedFilePreview}
                            />
                          )
                        ) : null}

                        {uploadingMedia ? (
                          <div className="mt-3">
                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full bg-sky-500 transition-all"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Uploading... {uploadProgress}%
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mb-2 flex items-end gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,video/mp4,video/webm"
                        className="hidden"
                        onChange={handleSelectFile}
                      />

                      <button
                        type="button"
                        className="btn-icon h-14 w-14 shrink-0 rounded-[20px]"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach media"
                      >
                        <Paperclip size={18} />
                      </button>

                      <label className="flex flex-1 rounded-[26px] border border-slate-200/90 bg-white shadow-sm transition duration-200 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20 dark:border-slate-700 dark:bg-slate-900/70">
                        <textarea
                          ref={textareaRef}
                          className="block max-h-56 min-h-[3.5rem] w-full resize-none overflow-hidden bg-transparent px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                          rows={1}
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            handleTextareaKeyDown(event).catch(() => null);
                          }}
                          placeholder={`Message ${activeConversationLabel}`}
                        />
                      </label>

                      <button
                        className="btn-primary h-14 w-14 shrink-0 rounded-[20px] p-0"
                        disabled={(!draft.trim() && !selectedFile) || sendingMessage || uploadingMedia}
                      >
                        {sendingMessage || uploadingMedia ? (
                          <LoaderCircle size={18} className="animate-spin" />
                        ) : (
                          <SendHorizontal size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {composerError || errorMessage ? (
                    <p className="mx-auto mt-3 max-w-3xl text-sm text-rose-500">
                      {composerError || errorMessage}
                    </p>
                  ) : null}
                </form>
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div className="max-w-sm">
                  <Inbox className="mx-auto text-slate-400" size={28} />
                  <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                    Pick a conversation
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Your live chat window shows up here once you choose a conversation.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </aside>

      {imagePreviewUrl ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-6">
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            onClick={() => setImagePreviewUrl("")}
            aria-label="Close image preview"
          >
            <X size={18} />
          </button>
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="max-h-full max-w-full rounded-[28px] object-contain shadow-2xl"
          />
        </div>
      ) : null}
    </div>
  );
};

export default InboxDrawer;
