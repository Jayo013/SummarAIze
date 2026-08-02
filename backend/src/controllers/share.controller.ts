import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createOrRotateShare,
  getPublicSharedSummary,
  getShareStatus,
  revokeShare,
} from "../services/share.service";
import { AppError } from "../utils/errors";
import type { AuthClaims } from "../types/auth";

const IdParam = z.object({ id: z.string().uuid("Invalid summary id.") });
const CreateBody = z.object({ expiresInDays: z.coerce.number().int().min(1).max(365).optional() });
const TokenParam = z.object({ token: z.string().min(1).max(64) });

function getAuthSub(req: Request): string {
  const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
  if (!auth0Sub) throw new AppError(401, "Unauthorized");
  return auth0Sub;
}

export async function getShareHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const { id } = IdParam.parse(req.params);
    const share = await getShareStatus(auth0Sub, id);
    return res.status(200).json({ share });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid summary id." });
    return next(err);
  }
}

export async function createShareHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const { id } = IdParam.parse(req.params);
    const { expiresInDays } = CreateBody.parse(req.body ?? {});
    const share = await createOrRotateShare(auth0Sub, id, expiresInDays);
    return res.status(201).json({ share });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid request." });
    return next(err);
  }
}

export async function revokeShareHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const { id } = IdParam.parse(req.params);
    await revokeShare(auth0Sub, id);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid summary id." });
    return next(err);
  }
}

export async function publicShareHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = TokenParam.parse(req.params);
    const shared = await getPublicSharedSummary(token);
    if (!shared) {
      return res.status(404).json({ error: "This link doesn't exist or has expired." });
    }
    // Read-only public content — short cache is safe and cuts DB load under repeated views,
    // while staying well within a revoke's expected propagation time.
    res.set("Cache-Control", "public, max-age=30");
    return res.status(200).json(shared);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: "Invalid share link." });
    return next(err);
  }
}
