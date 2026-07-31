import { Request, Response, NextFunction } from "express";
import { extractTextFromFile } from "../services/textExtraction.service";
import { AppError } from "../utils/errors";

export async function extractDocumentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      throw new AppError(400, "No file uploaded. Attach a file under the 'file' field.");
    }

    const { text, truncated } = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);

    return res.status(200).json({
      text,
      truncated,
      fileName: file.originalname,
      charCount: text.length,
    });
  } catch (err) {
    return next(err);
  }
}
