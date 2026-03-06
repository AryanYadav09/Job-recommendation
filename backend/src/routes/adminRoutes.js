import { Router } from "express";
import {
  getAllUsers,
  getAllCompanies,
  getAllJobs,
  deleteUser,
  deleteJob
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("ADMIN"));

router.get("/users", getAllUsers);
router.get("/companies", getAllCompanies);
router.get("/jobs", getAllJobs);
router.delete("/users/:userId", deleteUser);
router.delete("/jobs/:jobId", deleteJob);

export default router;
