import { useEffect, useRef } from "react";
import {
  MessageCircleMore,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff
} from "lucide-react";
import { useMessaging } from "../context/MessagingContext";
import { getInitials, toAbsoluteAssetUrl } from "../utils/format";

const statusLabelMap = {
  incoming: "Ringing...",
  calling: "Calling...",
  connecting: "Connecting...",
  connected: "Connected"
};

const StreamSurface = ({ stream, muted = false, mirror = false, placeholder }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.srcObject = stream || null;
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-[26px] bg-slate-950 text-sm text-slate-400">
        {placeholder}
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`h-full w-full rounded-[26px] bg-slate-950 object-cover ${mirror ? "-scale-x-100" : ""}`}
    />
  );
};

const ParticipantAvatar = ({ participant, large = false }) => {
  const sizeClassName = large ? "h-16 w-16 rounded-[1.5rem]" : "h-12 w-12 rounded-2xl";

  if (participant?.logoUrl) {
    return (
      <img
        src={toAbsoluteAssetUrl(participant.logoUrl)}
        alt={participant.name}
        className={`${sizeClassName} object-cover shadow-sm`}
      />
    );
  }

  return (
    <div
      className={`${sizeClassName} flex items-center justify-center bg-gradient-to-br from-sky-500 to-blue-700 font-display font-bold text-white shadow-sm`}
    >
      {getInitials(participant?.name || "JP")}
    </div>
  );
};

const CallOverlay = () => {
  const {
    currentCall,
    callErrorMessage,
    clearCallError,
    openConversation,
    acceptIncomingCall,
    rejectIncomingCall,
    endCall,
    toggleMute,
    toggleCamera
  } = useMessaging();

  useEffect(() => {
    if (!callErrorMessage) return undefined;

    const timeoutId = window.setTimeout(() => {
      clearCallError();
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [callErrorMessage, clearCallError]);

  return (
    <>
      {currentCall ? (
        <div className="fixed bottom-5 right-5 z-[70] w-[min(26rem,calc(100vw-2rem))]">
          <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
            <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ParticipantAvatar participant={currentCall.participant} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {currentCall.participant?.name || "Conversation"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {statusLabelMap[currentCall.status] || "Call"}
                    </p>
                  </div>
                </div>

                <button
                  className="btn-icon"
                  onClick={() => openConversation(currentCall.conversationId)}
                  aria-label="Open chat"
                >
                  <MessageCircleMore size={16} />
                </button>
              </div>
            </div>

            {currentCall.callType === "video" ? (
              <div className="relative bg-slate-950 px-4 py-4">
                <div className="aspect-[4/3] overflow-hidden rounded-[26px]">
                  <StreamSurface
                    stream={currentCall.remoteStream}
                    placeholder="Waiting for the other camera..."
                  />
                </div>

                <div className="absolute bottom-8 right-8 h-24 w-20 overflow-hidden rounded-[18px] border border-white/10 shadow-xl">
                  <StreamSurface
                    stream={currentCall.localStream}
                    muted
                    mirror
                    placeholder="No local video"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 px-5 py-6 text-center">
                <ParticipantAvatar participant={currentCall.participant} large />
                <p className="max-w-xs text-sm text-slate-600 dark:text-slate-300">
                  {currentCall.status === "incoming"
                    ? `${currentCall.participant?.name || "Someone"} is calling you.`
                    : currentCall.status === "connected"
                      ? "Voice call is live."
                      : "Connecting the voice call."}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 px-5 py-4">
              {currentCall.status === "incoming" ? (
                <>
                  <button
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600"
                    onClick={() => acceptIncomingCall().catch(() => null)}
                    aria-label="Accept call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600"
                    onClick={() => rejectIncomingCall().catch(() => null)}
                    aria-label="Reject call"
                  >
                    <PhoneOff size={18} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-icon h-12 w-12 rounded-full"
                    onClick={toggleMute}
                    aria-label="Toggle mute"
                  >
                    {currentCall.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>

                  {currentCall.callType === "video" ? (
                    <button
                      className="btn-icon h-12 w-12 rounded-full"
                      onClick={toggleCamera}
                      aria-label="Toggle camera"
                    >
                      {currentCall.isCameraEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                    </button>
                  ) : null}

                  <button
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600"
                    onClick={() => endCall().catch(() => null)}
                    aria-label="End call"
                  >
                    <PhoneOff size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {callErrorMessage && !currentCall ? (
        <div className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-slate-200/80 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-200">
          {callErrorMessage}
        </div>
      ) : null}
    </>
  );
};

export default CallOverlay;
