import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    requiredSkills: [
      {
        type: String,
        trim: true
      }
    ],
    category: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["remote", "full-time", "internship", "part-time", "hybrid"],
      required: true
    },
    salaryRange: {
      type: String,
      default: "Not disclosed",
      trim: true
    },
    salaryMin: {
      type: Number,
      default: null
    },
    salaryMax: {
      type: Number,
      default: null
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active"
    }
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
