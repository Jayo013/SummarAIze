import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { AppError } from "../utils/errors";

const MAX_CHARS = 20000;

async function extractPdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText({ pageJoiner: "\n" });
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractTxt(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

export async function extractTextFromFile(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<{ text: string; truncated: boolean }> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  let raw: string;
  try {
    if (mimetype === "application/pdf" || ext === "pdf") {
      raw = await extractPdf(buffer);
    } else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      raw = await extractDocx(buffer);
    } else if (mimetype === "text/plain" || ext === "txt") {
      raw = extractTxt(buffer);
    } else {
      throw new AppError(400, "Unsupported file type. Only PDF, DOCX, and TXT are allowed.");
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("[Text extraction] error:", String((err as Error)?.message || err));
    throw new AppError(400, "Could not read this file. It may be corrupted or password-protected.");
  }

  const text = raw.trim().replace(/\n{3,}/g, "\n\n");
  if (!text) {
    throw new AppError(400, "No readable text found in this file.");
  }

  const truncated = text.length > MAX_CHARS;
  return { text: truncated ? text.slice(0, MAX_CHARS) : text, truncated };
}
