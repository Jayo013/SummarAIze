import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { publicShareRateLimiter } from "../middleware/rateLimit";
import {
  createShareHandler,
  getShareHandler,
  publicShareHandler,
  revokeShareHandler,
} from "../controllers/share.controller";

const router = Router();

// Owner-only management of a summary's share link.
router.get("/summaries/:id/share", checkJwt, getShareHandler);
router.post("/summaries/:id/share", checkJwt, createShareHandler);
router.delete("/summaries/:id/share", checkJwt, revokeShareHandler);

// Public, read-only lookup by token — no auth.
router.get("/share/:token", publicShareRateLimiter, publicShareHandler);

export default router;
