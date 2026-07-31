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
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: MULTER_ERROR_MESSAGES[err.code] || "Invalid file upload." });
  }
  console.error("[Unhandled error]", err);
  return res.status(500).json({ error: "Unexpected server error. Check server logs." });
}
