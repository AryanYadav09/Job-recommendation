import User from "../models/User.js";
import UserAction from "../models/UserAction.js";
import Application from "../models/Application.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleValidation } from "../utils/handleValidation.js";

const PROFILE_FIELDS = [
  "name",
  "skills",
  "interests",
  "experienceLevel",
  "preferredCategory",
  "desiredRoles",
  "desiredJobTypes",
  "preferredLocations",
  "expectedSalaryMin",
  "expectedSalaryMax",
  "location"
];

const ONBOARDING_FIELDS = [
  "skills",
  "interests",
  "experienceLevel",
  "preferredCategory",
  "desiredRoles",
  "desiredJobTypes",
  "preferredLocations",
  "expectedSalaryMin",
  "expectedSalaryMax",
  "location"
];

const sanitizeNumeric = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const pickUpdates = (body, fields) => {
  const updates = {};
  fields.forEach((field) => {
    if (body[field] !== undefined) {
      if (field === "expectedSalaryMin" || field === "expectedSalaryMax") {
        updates[field] = sanitizeNumeric(body[field]);
      } else {
        updates[field] = body[field];
      }
    }
  });
  return updates;
};

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate({
      path: "savedJobs",
      populate: { path: "company", select: "name logoUrl" }
    });

  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res) => {
  handleValidation(req);

  const updates = pickUpdates(req.body, PROFILE_FIELDS);

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  }).select("-password");

  res.json({ message: "Profile updated", user });
});

export const completeOnboarding = asyncHandler(async (req, res) => {
  handleValidation(req);

  const user = await User.findById(req.user._id);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== "USER") {
    const error = new Error("Only users can complete onboarding");
    error.statusCode = 403;
    throw error;
  }

  if (user.onboardingCompleted) {
    const error = new Error("Onboarding already completed");
    error.statusCode = 409;
    throw error;
  }

  const updates = pickUpdates(req.body, ONBOARDING_FIELDS);
  Object.assign(user, updates);
  user.onboardingCompleted = true;

  await user.save();

  const safeUser = await User.findById(user._id).select("-password");

  res.json({
    message: "Onboarding completed successfully",
    user: safeUser
  });
});

export const getActivity = asyncHandler(async (req, res) => {
  const [views, saves, applies, applications] = await Promise.all([
    UserAction.countDocuments({ user: req.user._id, actionType: "view" }),
    UserAction.countDocuments({ user: req.user._id, actionType: "save" }),
    UserAction.countDocuments({ user: req.user._id, actionType: "apply" }),
    Application.find({ user: req.user._id })
      .populate({
        path: "job",
        populate: { path: "company", select: "name logoUrl" }
      })
      .sort({ createdAt: -1 })
      .lean()
  ]);

  res.json({
    counters: { views, saves, applies },
    applications
  });
});
