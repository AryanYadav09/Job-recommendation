import fs from "fs/promises";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  assertValidMediaPayload,
  buildConversationItem,
  buildMessageItem,
  clampPageSize,
  createLastMessageSnapshot,
  createMessagePreviewText,
  decodeMessageCursor,
  encodeMessageCursor,
  findOrCreateConversation,
  getConversationPartnerActor,
  hydrateConversation,
  loadConversationForActor,
  normalizeMediaPayload,
  populateConversationQuery,
  resolveMediaTypeFromMimeType,
  resolveActorFromUser,
  sanitizeMessageText
} from "../services/messagingService.js";
import {
  emitConversationUpsert,
  emitMessagesUpdated,
  emitToActor,
  isActorOnline
} from "../socket/socketServer.js";

export const listConversations = asyncHandler(async (req, res) => {
  const actor = resolveActorFromUser(req.user);

  const conversations = await populateConversationQuery(
    Conversation.find(actor.role === "USER" ? { user: actor.entityObjectId } : { company: actor.entityObjectId })
      .sort({ lastMessageAt: -1, updatedAt: -1, _id: -1 })
  ).lean();

  const items = conversations.map((conversation) =>
    buildConversationItem(conversation, actor, {
      isPartnerOnline: isActorOnline(getConversationPartnerActor(conversation, actor))
    })
  );

  res.json({
    conversations: items,
    totalUnreadCount: items.reduce((sum, item) => sum + item.unreadCount, 0)
  });
});

export const ensureConversation = asyncHandler(async (req, res) => {
  const actor = resolveActorFromUser(req.user);
  const { conversation, created } = await findOrCreateConversation(actor, req.body);

  const hydratedConversation = await hydrateConversation(conversation._id);
  const conversationItem = buildConversationItem(hydratedConversation, actor, {
    isPartnerOnline: isActorOnline(getConversationPartnerActor(hydratedConversation, actor))
  });

  await emitConversationUpsert(hydratedConversation);

  res.status(created ? 201 : 200).json({
    conversation: conversationItem
  });
});

export const getConversationMessages = asyncHandler(async (req, res) => {
  const actor = resolveActorFromUser(req.user);
  const { conversationId } = req.params;
  const { cursor } = req.query;

  await loadConversationForActor(conversationId, actor);

  const limit = clampPageSize(req.query.limit);
  const query = { conversation: conversationId };

  if (cursor) {
    const decodedCursor = decodeMessageCursor(cursor);
    query.$or = [
      { createdAt: { $lt: decodedCursor.createdAt } },
      {
        createdAt: decodedCursor.createdAt,
        _id: { $lt: decodedCursor.id }
      }
    ];
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const pageItems = hasMore ? messages.slice(0, limit) : messages;
  const orderedMessages = pageItems
    .reverse()
    .map((message) => buildMessageItem(message, actor));

  res.json({
    messages: orderedMessages,
    nextCursor: hasMore ? encodeMessageCursor(pageItems[pageItems.length - 1]) : null
  });
});

export const uploadConversationMedia = asyncHandler(async (req, res) => {
  try {
    const actor = resolveActorFromUser(req.user);
    await loadConversationForActor(req.params.conversationId, actor);

    if (!req.file) {
      const error = new Error("A media file is required");
      error.statusCode = 400;
      throw error;
    }

    const mediaType = resolveMediaTypeFromMimeType(req.file.mimetype);

    if (!mediaType) {
      const error = new Error("Unsupported media type");
      error.statusCode = 400;
      throw error;
    }

    res.status(201).json({
      media: {
        mediaUrl: `/uploads/chat-media/${req.file.filename}`,
        mediaType,
        mediaName: req.file.originalname,
        mediaSize: req.file.size
      }
    });
  } catch (error) {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => null);
    }
    throw error;
  }
});

export const sendMessage = asyncHandler(async (req, res) => {
  const actor = resolveActorFromUser(req.user);
  const conversation = await loadConversationForActor(req.params.conversationId, actor);
  const receiver = getConversationPartnerActor(conversation, actor);
  const messageText = sanitizeMessageText(req.body.messageText);
  const media = normalizeMediaPayload(req.body);

  assertValidMediaPayload(media);

  if (!messageText && !media.mediaUrl) {
    const error = new Error("Message text or media is required");
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.create({
    conversation: conversation._id,
    senderId: actor.entityObjectId,
    senderRole: actor.role,
    receiverId: receiver.entityObjectId,
    receiverRole: receiver.role,
    messageText,
    mediaUrl: media.mediaUrl,
    mediaType: media.mediaType,
    mediaName: media.mediaName,
    mediaSize: media.mediaSize,
    status: "sent"
  });

  const lastMessageText = createMessagePreviewText({
    messageText,
    mediaType: media.mediaType
  });

  const conversationUpdate = {
    lastMessage: createLastMessageSnapshot({
      text: lastMessageText,
      mediaType: media.mediaType,
      actor,
      createdAt: message.createdAt
    }),
    lastMessageAt: message.createdAt
  };

  await Conversation.findByIdAndUpdate(
    conversation._id,
    {
      $set: conversationUpdate,
      $inc: {
        [`unreadCounts.${receiver.unreadKey}`]: 1
      }
    },
    { new: true }
  );

  const messagePayload = message.toObject();
  const receiverOnline = isActorOnline(receiver);

  if (receiverOnline) {
    const deliveredAt = new Date();
    await Message.findByIdAndUpdate(message._id, {
      $set: {
        status: "delivered",
        deliveredAt
      }
    });

    messagePayload.status = "delivered";
    messagePayload.deliveredAt = deliveredAt;
  }

  const hydratedConversation = await hydrateConversation(conversation._id);
  const senderView = buildMessageItem(messagePayload, actor);
  const receiverView = buildMessageItem(messagePayload, receiver);

  emitToActor(actor, "message:new", senderView);
  emitToActor(receiver, "message:new", receiverView);
  await emitConversationUpsert(hydratedConversation);

  res.status(201).json({
    message: senderView
  });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  const actor = resolveActorFromUser(req.user);
  const conversation = await loadConversationForActor(req.params.conversationId, actor);

  const unreadMessages = await Message.find({
    conversation: conversation._id,
    receiverId: actor.entityObjectId,
    receiverRole: actor.role,
    status: { $in: ["sent", "delivered"] }
  })
    .select("_id deliveredAt")
    .lean();

  const readAt = new Date();
  const messageIds = unreadMessages.map((message) => message._id);

  if (messageIds.length) {
    await Message.updateMany(
      { _id: { $in: messageIds } },
      [
        {
          $set: {
            status: "read",
            deliveredAt: {
              $ifNull: ["$deliveredAt", readAt]
            },
            readAt
          }
        }
      ]
    );
  }

  await Conversation.findByIdAndUpdate(conversation._id, {
    $set: {
      [`unreadCounts.${actor.unreadKey}`]: 0
    }
  });

  const hydratedConversation = await hydrateConversation(conversation._id);
  await emitConversationUpsert(hydratedConversation);

  if (messageIds.length) {
    const sender = getConversationPartnerActor(conversation, actor);
    const messageStates = unreadMessages.map((message) => ({
      _id: String(message._id),
      deliveredAt: message.deliveredAt || readAt,
      readAt,
      status: "read"
    }));

    await emitMessagesUpdated([sender, actor], {
      conversationId: String(conversation._id),
      messageIds: messageIds.map(String),
      status: "read",
      readAt,
      messageStates
    });
  }

  res.json({
    messageIds: messageIds.map(String),
    readAt
  });
});
