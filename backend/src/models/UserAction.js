import mongoose from "mongoose";

const userActionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    actionType: {
      type: String,
      enum: ["view", "save", "apply"],
      required: true
    },
    weight: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

userActionSchema.index({ user: 1, job: 1, actionType: 1 });

const UserAction = mongoose.model("UserAction", userActionSchema);

export default UserAction;
