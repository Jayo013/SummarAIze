import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { dashboardHandler } from "../controllers/dashboard.controller";

const router = Router();
router.get("/dashboard", checkJwt, dashboardHandler);

export default router;
