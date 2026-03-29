import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe, verifyEmail, resendVerification } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail().withMessage("Valid email is required")
      .custom((value) => {
        if (!value.toLowerCase().endsWith("@gmail.com")) {
          throw new Error("Only Gmail addresses (@gmail.com) are accepted");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["USER", "COMPANY"])
      .withMessage("Invalid role")
  ],
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required")
  ],
  login
);

router.get("/verify-email/:token", verifyEmail);

router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Valid email is required")],
  resendVerification
);

router.get("/me", protect, getMe);

export default router;

