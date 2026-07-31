import multer from "multer";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "txt"]);

function hasAllowedExtension(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_EXTENSIONS.has(ext);
}

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !hasAllowedExtension(file.originalname)) {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
      return;
    }
    cb(null, true);
  },
});
