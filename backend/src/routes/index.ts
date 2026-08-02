import { Router } from "express";
import healthRoutes from "./health.routes";
import summarizeRoutes from "./summarize.routes";
import documentRoutes from "./document.routes";
import dashboardRoutes from "./dashboard.routes";
import historyRoutes from "./history.routes";
import shareRoutes from "./share.routes";
import chatRoutes from "./chat.routes";
import settingsRoutes from "./settings.routes";

const router = Router();
router.use(healthRoutes);
router.use(summarizeRoutes);
router.use(documentRoutes);
router.use(dashboardRoutes);
router.use(historyRoutes);
router.use(shareRoutes);
router.use(chatRoutes);
router.use(settingsRoutes);

export default router;
