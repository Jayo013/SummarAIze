import { Router } from "express";
import healthRoutes from "./health.routes";
import summarizeRoutes from "./summarize.routes";
import documentRoutes from "./document.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();
router.use(healthRoutes);
router.use(summarizeRoutes);
router.use(documentRoutes);
router.use(dashboardRoutes);

export default router;
