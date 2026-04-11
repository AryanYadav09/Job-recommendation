import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    senderRole: {
      type: String,
      enum: ["USER", "COMPANY"],
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    receiverRole: {
      type: String,
      enum: ["USER", "COMPANY"],
      required: true
    },
    messageText: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000
    },
    mediaUrl: {
      type: String,
      trim: true,
      default: ""
    },
    mediaType: {
      type: String,
      enum: ["", "image", "video"],
      default: ""
    },
    mediaName: {
      type: String,
      trim: true,
      default: ""
    },
    mediaSize: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent"
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 });
messageSchema.index({ receiverId: 1, receiverRole: 1, status: 1, createdAt: -1 });

messageSchema.pre("validate", function validateMessageContent(next) {
  if (!this.messageText && !this.mediaUrl) {
    this.invalidate("messageText", "Message text or media is required");
  }

  if (this.mediaUrl && !this.mediaType) {
    this.invalidate("mediaType", "mediaType is required when mediaUrl is provided");
  }

  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
