import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { summarizeRateLimiter } from "../middleware/rateLimit";
import { uploadDocument } from "../middleware/upload";
import { extractDocumentHandler } from "../controllers/document.controller";

const router = Router();
router.post("/documents/extract", summarizeRateLimiter, checkJwt, uploadDocument.single("file"), extractDocumentHandler);

export default router;
