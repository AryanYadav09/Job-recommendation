import { asyncHandler } from "../utils/asyncHandler.js";
import { generateRecommendations } from "../services/recommendationEngine.js";

export const getRecommendations = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;

  if (
    req.user.role !== "ADMIN" &&
    String(req.user._id) !== String(targetUserId)
  ) {
    const error = new Error("Forbidden: cannot access other user recommendations");
    error.statusCode = 403;
    throw error;
  }

  const recommendations = await generateRecommendations(targetUserId, 10);

  res.json({
    total: recommendations.length,
    recommendations
  });
});
