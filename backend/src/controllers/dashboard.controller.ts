import { Request, Response, NextFunction } from "express";
import { getDashboardStats } from "../services/dashboard.service";
import { AppError } from "../utils/errors";
import type { AuthClaims } from "../types/auth";

export async function dashboardHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
    if (!auth0Sub) {
      throw new AppError(401, "Unauthorized");
    }
    const stats = await getDashboardStats(auth0Sub);
    return res.status(200).json(stats);
  } catch (err) {
    return next(err);
  }
}
