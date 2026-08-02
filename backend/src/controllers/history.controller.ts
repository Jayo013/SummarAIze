import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getSummaryHistory, getDistinctProviders } from "../services/history.service";
import { SUMMARY_MODES } from "../services/summaryModes";
import { AppError } from "../utils/errors";
import type { AuthClaims } from "../types/auth";

const Query = z.object({
  search: z.string().trim().max(200).optional(),
  mode: z.enum(SUMMARY_MODES).optional(),
  provider: z.string().trim().max(50).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

function getAuthSub(req: Request): string {
  const auth0Sub = (req as Request & { auth?: AuthClaims }).auth?.sub;
  if (!auth0Sub) throw new AppError(401, "Unauthorized");
  return auth0Sub;
}

export async function historyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const parsed = Query.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid query parameters.", detail: parsed.error.flatten() });
    }
    const { search, mode, provider, dateFrom, dateTo, page, limit } = parsed.data;

    if (dateFrom && dateTo && dateFrom > dateTo) {
      return res.status(400).json({ error: "'dateFrom' must be before 'dateTo'." });
    }

    const result = await getSummaryHistory({
      auth0Sub,
      search: search || undefined,
      mode,
      provider,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function historyProvidersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const auth0Sub = getAuthSub(req);
    const providers = await getDistinctProviders(auth0Sub);
    return res.status(200).json({ providers });
  } catch (err) {
    return next(err);
  }
}
