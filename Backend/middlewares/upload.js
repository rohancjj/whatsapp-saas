import multer from "multer";
import path from "path";
import fs from "fs";

/**
 * Utility to create a safe upload folder.
 */
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

/**
 * Reusable upload builder.
 * @param {String} folderName - subfolder inside /uploads
 * @param {String[]} allowedTypes - allowed MIME prefixes (e.g. ["image", "pdf"])
 */
export const createUploader = (folderName, allowedTypes = ["image", "pdf"]) => {
  const UPLOAD_DIR = path.join(process.cwd(), "uploads", folderName);
  ensureDir(UPLOAD_DIR);

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const random = Math.random().toString(36).slice(2, 8);
      cb(null, `${Date.now()}-${random}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const type = file.mimetype.split("/")[0];
    const ext = file.mimetype.split("/")[1];

    if (
      allowedTypes.includes(type) ||
      allowedTypes.includes(ext)
    ) {
      return cb(null, true);
    }

    cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  };

  return multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter,
  });
};

// =============================
// READY-TO-USE UPLOADERS
// =============================

// Payment screenshot upload
export const uploadPayment = createUploader("payments", ["image", "pdf"]);

// Support attachments upload
export const uploadSupport = createUploader("support", ["image", "pdf"]);
