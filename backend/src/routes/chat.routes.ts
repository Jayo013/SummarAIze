import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { chatRateLimiter } from "../middleware/rateLimit";
import { deleteChatHandler, getChatHandler, postChatHandler } from "../controllers/chat.controller";

const router = Router();
router.get("/summaries/:id/chat", checkJwt, getChatHandler);
router.post("/summaries/:id/chat", chatRateLimiter, checkJwt, postChatHandler);
router.delete("/summaries/:id/chat", checkJwt, deleteChatHandler);

export default router;
