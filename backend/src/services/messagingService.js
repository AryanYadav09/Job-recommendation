import mongoose from "mongoose";
import Application from "../models/Application.js";
import Company from "../models/Company.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

const MESSAGE_MAX_LENGTH = 2000;

export const MESSAGE_PAGE_SIZE = 20;
export const MAX_MESSAGE_PAGE_SIZE = 50;

export const sanitizeMessageText = (value) =>
  String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MESSAGE_MAX_LENGTH);

export const resolveMediaTypeFromMimeType = (mimeType = "") => {
  if (/^image\//i.test(mimeType)) return "image";
  if (/^video\//i.test(mimeType)) return "video";
  return "";
};

export const createMessagePreviewText = ({ messageText, mediaType }) => {
  const safeText = sanitizeMessageText(messageText);
  if (safeText) return safeText;
  if (mediaType === "image") return "Photo";
  if (mediaType === "video") return "Video";
  return "Start the conversation";
};

export const normalizeMediaPayload = (payload = {}) => ({
  mediaUrl: String(payload.mediaUrl || "").trim(),
  mediaType: String(payload.mediaType || "").trim().toLowerCase(),
  mediaName: String(payload.mediaName || "").trim(),
  mediaSize: Number(payload.mediaSize) || 0
});

export const assertValidMediaPayload = ({ mediaUrl, mediaType, mediaSize }) => {
  if (!mediaUrl && !mediaType && !mediaSize) return;

  if (!mediaUrl || !["image", "video"].includes(mediaType)) {
    const error = new Error("Valid mediaUrl and mediaType are required");
    error.statusCode = 400;
    throw error;
  }

  if (mediaSize < 0 || mediaSize > 20 * 1024 * 1024) {
    const error = new Error("Media file size exceeds the 20MB limit");
    error.statusCode = 400;
    throw error;
  }
};

export const ensureValidObjectId = (value, message) => {
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error(message);
    error.statusCode = 400;
    throw error;
  }
};

export const clampPageSize = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return MESSAGE_PAGE_SIZE;
  return Math.min(Math.max(Math.trunc(parsed), 1), MAX_MESSAGE_PAGE_SIZE);
};

export const encodeMessageCursor = (message) =>
  Buffer.from(
    JSON.stringify({
      createdAt: new Date(message.createdAt).toISOString(),
      id: String(message._id)
    })
  ).toString("base64url");

export const decodeMessageCursor = (value) => {
  try {
    const parsed = JSON.parse(Buffer.from(String(value), "base64url").toString("utf8"));
    ensureValidObjectId(parsed.id, "Invalid cursor");

    const createdAt = new Date(parsed.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      const error = new Error("Invalid cursor");
      error.statusCode = 400;
      throw error;
    }

    return {
      createdAt,
      id: parsed.id
    };
  } catch (error) {
    if (error.statusCode) throw error;

    const cursorError = new Error("Invalid cursor");
    cursorError.statusCode = 400;
    throw cursorError;
  }
};

export const resolveActorFromUser = (user) => {
  if (!user || !["USER", "COMPANY"].includes(user.role)) {
    const error = new Error("Messaging is only available for users and companies");
    error.statusCode = 403;
    throw error;
  }

  if (user.role === "COMPANY") {
    if (!user.company) {
      const error = new Error("Company account is not linked to a company profile");
      error.statusCode = 403;
      throw error;
    }

    return {
      role: "COMPANY",
      entityId: String(user.company),
      entityObjectId: user.company,
      unreadKey: "company"
    };
  }

  return {
    role: "USER",
    entityId: String(user._id),
    entityObjectId: user._id,
    unreadKey: "user"
  };
};

export const getConversationAccessQuery = (actor) =>
  actor.role === "USER" ? { user: actor.entityObjectId } : { company: actor.entityObjectId };

export const populateConversationQuery = (query) =>
  query
    .populate("user", "name email location skills experienceLevel experienceSummary resumeUrl")
    .populate("company", "name logoUrl location industry description website businessEmail");

export const hydrateConversation = async (conversationId) =>
  populateConversationQuery(Conversation.findById(conversationId)).lean();

export const assertConversationAccess = (conversation, actor) => {
  if (!conversation) {
    const error = new Error("Conversation not found");
    error.statusCode = 404;
    throw error;
  }

  const canAccess =
    (actor.role === "USER" && String(conversation.user) === actor.entityId) ||
    (actor.role === "COMPANY" && String(conversation.company) === actor.entityId);

  if (!canAccess) {
    const error = new Error("You do not have access to this conversation");
    error.statusCode = 403;
    throw error;
  }
};

export const getConversationPartnerActor = (conversation, actor) => {
  if (actor.role === "USER") {
    return {
      role: "COMPANY",
      entityId: String(conversation.company?._id || conversation.company),
      entityObjectId: conversation.company?._id || conversation.company,
      unreadKey: "company"
    };
  }

  return {
    role: "USER",
    entityId: String(conversation.user?._id || conversation.user),
    entityObjectId: conversation.user?._id || conversation.user,
    unreadKey: "user"
  };
};

export const getConversationActors = (conversation) => ({
  user: {
    role: "USER",
    entityId: String(conversation.user?._id || conversation.user),
    entityObjectId: conversation.user?._id || conversation.user,
    unreadKey: "user"
  },
  company: {
    role: "COMPANY",
    entityId: String(conversation.company?._id || conversation.company),
    entityObjectId: conversation.company?._id || conversation.company,
    unreadKey: "company"
  }
});

export const buildConversationItem = (conversation, actor, options = {}) => {
  const partner = actor.role === "USER" ? conversation.company : conversation.user;
  const unreadCount =
    actor.role === "USER" ? conversation.unreadCounts?.user || 0 : conversation.unreadCounts?.company || 0;

  return {
    _id: String(conversation._id),
    partner: actor.role === "USER"
      ? {
          _id: String(partner?._id || conversation.company),
          role: "COMPANY",
          name: partner?.name || "Company",
          subtitle: partner?.industry || partner?.location || "Recruiter",
          logoUrl: partner?.logoUrl || "",
          online: Boolean(options.isPartnerOnline)
        }
      : {
          _id: String(partner?._id || conversation.user),
          role: "USER",
          name: partner?.name || "Candidate",
          subtitle: partner?.location || partner?.email || "Job seeker",
          logoUrl: "",
          online: Boolean(options.isPartnerOnline)
        },
    lastMessage: conversation.lastMessage
      ? {
          text: conversation.lastMessage.text,
          mediaType: conversation.lastMessage.mediaType || "",
          senderRole: conversation.lastMessage.senderRole,
          createdAt: conversation.lastMessage.createdAt
        }
      : null,
    lastMessagePreview: conversation.lastMessage?.text || "Start the conversation",
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    unreadCount,
    initiatedByRole: conversation.initiatedByRole,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
};

export const buildMessageItem = (message, actor) => ({
  _id: String(message._id),
  conversationId: String(message.conversation),
  senderId: String(message.senderId),
  senderRole: message.senderRole,
  receiverId: String(message.receiverId),
  receiverRole: message.receiverRole,
  messageText: message.messageText,
  mediaUrl: message.mediaUrl || "",
  mediaType: message.mediaType || "",
  mediaName: message.mediaName || "",
  mediaSize: message.mediaSize || 0,
  status: message.status,
  createdAt: message.createdAt,
  deliveredAt: message.deliveredAt,
  readAt: message.readAt,
  isOwnMessage: message.senderRole === actor.role && String(message.senderId) === actor.entityId
});

export const createLastMessageSnapshot = ({ text, mediaType, actor, createdAt }) => ({
  text,
  mediaType: mediaType || "",
  senderId: actor.entityObjectId,
  senderRole: actor.role,
  createdAt
});

export const loadConversationForActor = async (conversationId, actor) => {
  ensureValidObjectId(conversationId, "Invalid conversation id");

  const conversation = await Conversation.findById(conversationId);
  assertConversationAccess(conversation, actor);
  return conversation;
};

export const findOrCreateConversation = async (actor, { targetUserId, targetCompanyId }) => {
  let userId = actor.role === "USER" ? actor.entityObjectId : null;
  let companyId = actor.role === "COMPANY" ? actor.entityObjectId : null;

  if (actor.role === "USER") {
    ensureValidObjectId(targetCompanyId, "A valid company id is required");

    const targetCompany = await Company.findById(targetCompanyId).select("_id").lean();
    if (!targetCompany) {
      const error = new Error("Company not found");
      error.statusCode = 404;
      throw error;
    }

    const hasApplied = await Application.exists({
      user: actor.entityObjectId,
      company: targetCompanyId
    });

    if (!hasApplied) {
      const error = new Error("You can only message companies after applying to one of their jobs");
      error.statusCode = 403;
      throw error;
    }

    companyId = targetCompanyId;
  } else {
    ensureValidObjectId(targetUserId, "A valid user id is required");

    const targetUser = await User.findOne({
      _id: targetUserId,
      role: "USER"
    })
      .select("_id")
      .lean();

    if (!targetUser) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    userId = targetUserId;
  }

  let conversation = await Conversation.findOne({ user: userId, company: companyId });
  let created = false;

  if (!conversation) {
    try {
      conversation = await Conversation.create({
        user: userId,
        company: companyId,
        initiatedBy: actor.entityObjectId,
        initiatedByRole: actor.role
      });
      created = true;
    } catch (error) {
      if (error.code !== 11000) throw error;
      conversation = await Conversation.findOne({ user: userId, company: companyId });
    }
  }

  return { conversation, created };
};
