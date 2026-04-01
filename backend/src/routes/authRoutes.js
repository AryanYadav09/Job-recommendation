import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe, verifyEmail, resendVerification } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["USER", "COMPANY"])
      .withMessage("Invalid role"),
    body("companyName")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Company name is too short")
  ],
  register
);

router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  login
);

router.get("/verify-email/:token", verifyEmail);

router.post(
  "/resend-verification",
  [body("email").trim().isEmail().withMessage("Valid email is required")],
  resendVerification
);

router.get("/me", protect, getMe);

export default router;
