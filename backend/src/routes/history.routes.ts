import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { historyHandler, historyProvidersHandler } from "../controllers/history.controller";

const router = Router();
router.get("/summaries", checkJwt, historyHandler);
router.get("/summaries/providers", checkJwt, historyProvidersHandler);

export default router;
