import { Router } from "express";
import { checkJwt } from "../middleware/auth";
import { getSettingsHandler, updateSettingsHandler } from "../controllers/settings.controller";

const router = Router();
router.get("/settings", checkJwt, getSettingsHandler);
router.put("/settings", checkJwt, updateSettingsHandler);

export default router;
