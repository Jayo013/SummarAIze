import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  console.error("[Unhandled error]", err);
  return res.status(500).json({ error: "Unexpected server error. Check server logs." });
}
