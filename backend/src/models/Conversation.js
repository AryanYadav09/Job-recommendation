import mongoose from "mongoose";

const lastMessageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: "",
      trim: true
    },
    mediaType: {
      type: String,
      enum: ["", "image", "video"],
      default: ""
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
    createdAt: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

const unreadCountsSchema = new mongoose.Schema(
  {
    user: {
      type: Number,
      default: 0,
      min: 0
    },
    company: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    initiatedByRole: {
      type: String,
      enum: ["USER", "COMPANY"],
      required: true
    },
    lastMessage: {
      type: lastMessageSchema,
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: null
    },
    unreadCounts: {
      type: unreadCountsSchema,
      default: () => ({})
    }
  },
  { timestamps: true }
);

conversationSchema.index({ user: 1, company: 1 }, { unique: true });
conversationSchema.index({ user: 1, lastMessageAt: -1, updatedAt: -1 });
conversationSchema.index({ company: 1, lastMessageAt: -1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
