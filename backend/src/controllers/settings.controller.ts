import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getUserSettings, updateUserSettings } from "../services/settings.service";
import { SUMMARY_MODES } from "../services/summaryModes";
import { AppError } from "../utils/errors";
import type { AuthClaims } from "../types/auth";

const PROVIDERS = ["gemini", "groq", "openai"] as const;
const EXPORT_FORMATS = ["txt", "pdf"] as const;

const UpdateBody = z.object({
  preferredProvider: z.enum(PROVIDERS).nullable().optional(),
  preferredMode: z.enum(SUMMARY_MODES).optional(),
  preferredExportFormat: z.enum(EXPORT_FORMATS).optional(),
});

function getAuthSub(req: Request): string {
  const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
  if (!auth0Sub) throw new AppError(401, "Unauthorized");
  return auth0Sub;
}

export async function getSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const settings = await getUserSettings(auth0Sub);
    return res.status(200).json(settings);
  } catch (err) {
    return next(err);
  }
}

export async function updateSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const patch = UpdateBody.parse(req.body);
    const settings = await updateUserSettings(auth0Sub, patch);
    return res.status(200).json(settings);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid settings.", detail: err.flatten() });
    }
    return next(err);
  }
}
