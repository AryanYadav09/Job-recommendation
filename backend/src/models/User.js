import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["USER", "COMPANY", "ADMIN"],
      default: "USER"
    },
    skills: [
      {
        type: String,
        trim: true
      }
    ],
    interests: [
      {
        type: String,
        trim: true
      }
    ],
    experienceLevel: {
      type: String,
      enum: ["FRESHER", "JUNIOR", "MID", "SENIOR"],
      default: "JUNIOR"
    },
    preferredCategory: {
      type: String,
      trim: true,
      default: ""
    },
    desiredRoles: [
      {
        type: String,
        trim: true
      }
    ],
    desiredJobTypes: [
      {
        type: String,
        enum: ["remote", "full-time", "internship", "part-time", "hybrid"]
      }
    ],
    preferredLocations: [
      {
        type: String,
        trim: true
      }
    ],
    expectedSalaryMin: {
      type: Number,
      default: null
    },
    expectedSalaryMax: {
      type: Number,
      default: null
    },
    location: {
      type: String,
      trim: true,
      default: ""
    },
    onboardingCompleted: {
      type: Boolean,
      default: function onboardingDefault() {
        return this.role !== "USER";
      }
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company"
    },
    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job"
      }
    ]
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
