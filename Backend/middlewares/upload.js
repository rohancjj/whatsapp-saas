import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "payments");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    if (/image|pdf/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"), false);
  }
});
