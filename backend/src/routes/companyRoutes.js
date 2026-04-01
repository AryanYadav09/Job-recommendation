import { Router } from "express";
import { body } from "express-validator";
import {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyCertificate,
  createJob,
  updateJob,
  deleteJob,
  getCompanyJobs,
  getJobApplicants,
  getDashboard
} from "../controllers/companyController.js";
import { companyCertificateUpload } from "../middleware/uploadMiddleware.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("COMPANY"));

router.get("/dashboard", getDashboard);
router.get("/profile", getCompanyProfile);
router.put(
  "/profile",
  [
    body("name").optional().isLength({ min: 2 }).withMessage("Name is too short"),
    body("website").optional().isString(),
    body("location").optional().isString(),
    body("industry").optional().isString(),
    body("size").optional().isString(),
    body("businessEmail").optional().isEmail().withMessage("Valid business email is required"),
    body("registrationNumber").optional().isString(),
    body("registrationJurisdiction").optional().isString(),
    body("logoUrl").optional().isString()
  ],
  updateCompanyProfile
);
router.post(
  "/verification/certificate",
  companyCertificateUpload.single("certificate"),
  uploadCompanyCertificate
);

router.get("/jobs", getCompanyJobs);
router.post(
  "/jobs",
  [
    body("title").trim().notEmpty().withMessage("title is required"),
    body("description").trim().notEmpty().withMessage("description is required"),
    body("requiredSkills").isArray({ min: 1 }).withMessage("requiredSkills is required"),
    body("category").trim().notEmpty().withMessage("category is required"),
    body("location").trim().notEmpty().withMessage("location is required"),
    body("type")
      .isIn(["remote", "full-time", "internship", "part-time", "hybrid"])
      .withMessage("invalid job type"),
    body("salaryMin")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("salaryMin must be a positive number"),
    body("salaryMax")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("salaryMax must be a positive number"),
    body("salaryMax").custom((value, { req }) => {
      if (value === null || value === undefined || value === "") return true;
      if (req.body.salaryMin === null || req.body.salaryMin === undefined) return true;
      if (Number(value) < Number(req.body.salaryMin)) {
        throw new Error("salaryMax must be >= salaryMin");
      }
      return true;
    })
  ],
  createJob
);

router.put(
  "/jobs/:jobId",
  [
    body("requiredSkills").optional().isArray().withMessage("requiredSkills must be an array"),
    body("type")
      .optional()
      .isIn(["remote", "full-time", "internship", "part-time", "hybrid"])
      .withMessage("invalid job type"),
    body("status").optional().isIn(["active", "closed"]).withMessage("invalid status"),
    body("salaryMin")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("salaryMin must be a positive number"),
    body("salaryMax")
      .optional({ nullable: true })
      .isFloat({ min: 0 })
      .withMessage("salaryMax must be a positive number"),
    body("salaryMax").custom((value, { req }) => {
      if (value === null || value === undefined || value === "") return true;
      if (req.body.salaryMin === null || req.body.salaryMin === undefined) return true;
      if (Number(value) < Number(req.body.salaryMin)) {
        throw new Error("salaryMax must be >= salaryMin");
      }
      return true;
    })
  ],
  updateJob
);

router.delete("/jobs/:jobId", deleteJob);
router.get("/jobs/:jobId/applicants", getJobApplicants);

export default router;
