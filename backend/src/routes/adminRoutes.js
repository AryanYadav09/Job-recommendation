import { Router } from "express";
import { body } from "express-validator";
import {
  getAllUsers,
  getAllCompanies,
  getAllJobs,
  deleteUser,
  deleteJob,
  reviewCompanyVerification
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("ADMIN"));

router.get("/users", getAllUsers);
router.get("/companies", getAllCompanies);
router.get("/jobs", getAllJobs);
router.patch(
  "/companies/:companyId/verification",
  [
    body("status")
      .isIn(["VERIFIED", "REJECTED"])
      .withMessage("status must be VERIFIED or REJECTED"),
    body("notes").optional().isString()
  ],
  reviewCompanyVerification
);
router.delete("/users/:userId", deleteUser);
router.delete("/jobs/:jobId", deleteJob);

export default router;
