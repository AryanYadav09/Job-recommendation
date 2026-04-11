import { Router } from "express";
import { body } from "express-validator";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { chatMediaUpload } from "../middleware/uploadMiddleware.js";
import {
  ensureConversation,
  getConversationMessages,
  listConversations,
  markConversationRead,
  sendMessage,
  uploadConversationMedia
} from "../controllers/messageController.js";

const router = Router();

router.use(protect, authorize("USER", "COMPANY"));

router.get("/conversations", listConversations);
router.post("/conversations", ensureConversation);
router.get("/conversations/:conversationId/messages", getConversationMessages);
router.post(
  "/conversations/:conversationId/media",
  chatMediaUpload.single("file"),
  uploadConversationMedia
);
router.post(
  "/conversations/:conversationId/messages",
  [
    body("messageText").optional().isString().withMessage("messageText must be text"),
    body("mediaUrl").optional().isString().withMessage("mediaUrl must be text"),
    body("mediaType")
      .optional()
      .isIn(["image", "video"])
      .withMessage("mediaType must be image or video"),
    body("mediaName").optional().isString().withMessage("mediaName must be text"),
    body("mediaSize").optional().isNumeric().withMessage("mediaSize must be numeric")
  ],
  sendMessage
);
router.post("/conversations/:conversationId/read", markConversationRead);

export default router;
