import crypto from "crypto";
import User from "../models/User.js";
import Company from "../models/Company.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleValidation } from "../utils/handleValidation.js";
import { sendVerificationEmail } from "../utils/emailService.js";

const userResponse = async (userId) => {
  const user = await User.findById(userId).select("-password").populate("company");
  return user;
};

export const register = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { name, email, password, role = "USER", companyName } = req.body;

  if (role === "ADMIN") {
    const error = new Error("Admin signup is disabled");
    error.statusCode = 403;
    throw error;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  if (role === "COMPANY" && !companyName) {
    const error = new Error("companyName is required for COMPANY role");
    error.statusCode = 400;
    throw error;
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    name,
    email,
    password,
    role,
    onboardingCompleted: role !== "USER",
    isEmailVerified: false,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires
  });

  if (role === "COMPANY") {
    const company = await Company.create({
      owner: user._id,
      name: companyName
    });
    user.company = company._id;
    await user.save();
  }

  await sendVerificationEmail(email, verificationToken);

  res.status(201).json({
    message: "Account created! A verification link has been sent to your Gmail. Please check your inbox."
  });
});

export const login = asyncHandler(async (req, res) => {
  handleValidation(req);

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await user.matchPassword(password))) {
    const error = new Error("Invalid credentials");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isEmailVerified) {
    const error = new Error("Please verify your Gmail address before logging in.");
    error.statusCode = 403;
    error.code = "EMAIL_UNVERIFIED";
    throw error;
  }

  const safeUser = await userResponse(user._id);

  res.json({
    message: "Login successful",
    token: generateToken(user._id, user.role),
    user: safeUser
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    const error = new Error("Verification link is invalid or has expired. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();

  const safeUser = await userResponse(user._id);

  res.json({
    message: "Gmail verified successfully! Welcome to JobPulse.",
    token: generateToken(user._id, user.role),
    user: safeUser
  });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user || user.isEmailVerified) {
    // Intentionally vague to avoid email enumeration
    return res.json({ message: "If that Gmail is registered and unverified, a new link has been sent." });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  await sendVerificationEmail(email, verificationToken);

  res.json({ message: "Verification email resent. Please check your Gmail." });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await userResponse(req.user._id);
  res.json(user);
});

