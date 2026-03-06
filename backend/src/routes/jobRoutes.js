import { Router } from "express";
import {
  getJobs,
  getJobById,
  trackView,
  toggleSaveJob,
  applyToJob,
  getSavedJobs
} from "../controllers/jobController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getJobs);
router.get("/saved", protect, authorize("USER"), getSavedJobs);
router.get("/:jobId", getJobById);

router.post("/:jobId/view", protect, authorize("USER"), trackView);
router.post("/:jobId/save", protect, authorize("USER"), toggleSaveJob);
router.post("/:jobId/apply", protect, authorize("USER"), applyToJob);

export default router;
