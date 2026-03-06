import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    resumeUrl: {
      type: String,
      default: "",
      trim: true
    },
    coverLetter: {
      type: String,
      default: "",
      trim: true
    },
    status: {
      type: String,
      enum: ["submitted", "reviewing", "shortlisted", "rejected", "hired"],
      default: "submitted"
    }
  },
  { timestamps: true }
);

applicationSchema.index({ user: 1, job: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

export default Application;
