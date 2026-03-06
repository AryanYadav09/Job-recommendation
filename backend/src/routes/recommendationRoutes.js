import { Router } from "express";
import { getRecommendations } from "../controllers/recommendationController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:userId", protect, authorize("USER", "ADMIN"), getRecommendations);

export default router;
