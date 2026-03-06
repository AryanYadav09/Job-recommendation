import User from "../models/User.js";
import Company from "../models/Company.js";
import { generateToken } from "../utils/generateToken.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { handleValidation } from "../utils/handleValidation.js";

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

  const user = await User.create({
    name,
    email,
    password,
    role,
    onboardingCompleted: role !== "USER"
  });

  if (role === "COMPANY") {
    const company = await Company.create({
      owner: user._id,
      name: companyName
    });
    user.company = company._id;
    await user.save();
  }

  const safeUser = await userResponse(user._id);

  res.status(201).json({
    message: "User registered successfully",
    token: generateToken(user._id, user.role),
    user: safeUser
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

  const safeUser = await userResponse(user._id);

  res.json({
    message: "Login successful",
    token: generateToken(user._id, user.role),
    user: safeUser
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await userResponse(req.user._id);
  res.json(user);
});
