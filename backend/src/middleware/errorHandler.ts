import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { AppError } from "../utils/errors";

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Not found" });
}

const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: "File is too large. Maximum size is 10MB.",
  LIMIT_UNEXPECTED_FILE: "Unsupported file type. Only PDF, DOCX, and TXT are allowed.",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  // pino-http assigns a unique id to every request; surfacing it in the error body lets a
  // user's bug report be correlated with the exact structured log line on the server.
  const requestId = (req as Request & { id?: string }).id;
  const log = (req as Request & { log?: { error: (obj: unknown, msg?: string) => void } }).log;

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, requestId, ...err.extra });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: MULTER_ERROR_MESSAGES[err.code] || "Invalid file upload.", requestId });
  }

  if (log) {
    log.error({ err }, "Unhandled error");
  } else {
    console.error("[Unhandled error]", err);
  }
  return res.status(500).json({ error: "Unexpected server error. Check server logs.", requestId });
}
