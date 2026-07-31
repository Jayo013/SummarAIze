import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { summarizeRateLimiter } from "../middleware/rateLimit";
import { summarizeHandler } from "../controllers/summarize.controller";

const router = Router();
router.post("/summarize", summarizeRateLimiter, checkJwt, summarizeHandler);

export default router;
