import { Router } from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  completeOnboarding,
  getActivity,
  getPublicUserProfile
} from "../controllers/userController.js";

const router = Router();

const profileValidation = [
  body("name").optional().isLength({ min: 2 }).withMessage("Name too short"),
  body("skills").optional().isArray().withMessage("skills must be an array"),
  body("interests").optional().isArray().withMessage("interests must be an array"),
  body("experienceLevel")
    .optional()
    .isIn(["FRESHER", "JUNIOR", "MID", "SENIOR"])
    .withMessage("Invalid experience level"),
  body("preferredCategory")
    .optional()
    .isString()
    .withMessage("preferredCategory must be text"),
  body("desiredRoles").optional().isArray().withMessage("desiredRoles must be an array"),
  body("desiredJobTypes")
    .optional()
    .isArray()
    .withMessage("desiredJobTypes must be an array"),
  body("desiredJobTypes.*")
    .optional()
    .isIn(["remote", "full-time", "internship", "part-time", "hybrid"])
    .withMessage("Invalid desired job type"),
  body("preferredLocations")
    .optional()
    .isArray()
    .withMessage("preferredLocations must be an array"),
  body("expectedSalaryMin")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("expectedSalaryMin must be a positive number"),
  body("expectedSalaryMax")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("expectedSalaryMax must be a positive number"),
  body("location").optional().isString().withMessage("location must be text"),
  body("experienceSummary").optional().isString().withMessage("experienceSummary must be text"),
  body("resumeUrl").optional().isString().withMessage("resumeUrl must be text"),
  body("expectedSalaryMax").custom((value, { req }) => {
    if (value === null || value === undefined || value === "") return true;
    if (req.body.expectedSalaryMin === null || req.body.expectedSalaryMin === undefined) {
      return true;
    }
    if (Number(value) < Number(req.body.expectedSalaryMin)) {
      throw new Error("expectedSalaryMax must be >= expectedSalaryMin");
    }
    return true;
  })
];

router.get(
  "/:userId/public-profile",
  protect,
  authorize("USER", "COMPANY", "ADMIN"),
  getPublicUserProfile
);
router.get("/profile", protect, getProfile);
router.get("/activity", protect, authorize("USER"), getActivity);

router.put("/profile", protect, profileValidation, updateProfile);

router.post(
  "/onboarding",
  protect,
  authorize("USER"),
  [
    body("skills").isArray({ min: 1 }).withMessage("At least one skill is required"),
    body("interests").optional().isArray().withMessage("interests must be an array"),
    body("experienceLevel")
      .isIn(["FRESHER", "JUNIOR", "MID", "SENIOR"])
      .withMessage("Invalid experience level"),
    body("preferredCategory")
      .isString()
      .notEmpty()
      .withMessage("preferredCategory is required"),
    body("desiredRoles")
      .isArray({ min: 1 })
      .withMessage("At least one desired role is required"),
    body("desiredJobTypes")
      .isArray({ min: 1 })
      .withMessage("At least one desired job type is required"),
    body("desiredJobTypes.*")
      .isIn(["remote", "full-time", "internship", "part-time", "hybrid"])
      .withMessage("Invalid desired job type"),
    body("preferredLocations")
      .isArray({ min: 1 })
      .withMessage("At least one preferred location is required"),
    body("expectedSalaryMin")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("expectedSalaryMin must be a positive number"),
    body("expectedSalaryMax")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("expectedSalaryMax must be a positive number"),
    body("location").optional().isString().withMessage("location must be text"),
    body("expectedSalaryMax").custom((value, { req }) => {
      if (value === null || value === undefined || value === "") return true;
      if (req.body.expectedSalaryMin === null || req.body.expectedSalaryMin === undefined) {
        return true;
      }
      if (Number(value) < Number(req.body.expectedSalaryMin)) {
        throw new Error("expectedSalaryMax must be >= expectedSalaryMin");
      }
      return true;
    })
  ],
  completeOnboarding
);

export default router;
