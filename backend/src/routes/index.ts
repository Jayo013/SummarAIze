import { Router } from "express";
import healthRoutes from "./health.routes";
import summarizeRoutes from "./summarize.routes";

const router = Router();
router.use(healthRoutes);
router.use(summarizeRoutes);

export default router;
