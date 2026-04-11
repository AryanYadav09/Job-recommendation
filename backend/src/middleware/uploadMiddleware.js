import path from "path";
import multer from "multer";
import { ensureDirectory, uploadsRootDir } from "../utils/uploadsPath.js";

const companyCertificatesDir = path.join(uploadsRootDir, "company-certificates");
const chatMediaDir = path.join(uploadsRootDir, "chat-media");

[companyCertificatesDir, chatMediaDir].forEach((dir) => {
  ensureDirectory(dir);
});

const createStorage = (destination) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "-");
      cb(null, `${Date.now()}-${safeOriginalName}`);
    }
  });

const createFileFilter = (allowedMimeTypes, errorMessage) => (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error(errorMessage);
    error.statusCode = 400;
    cb(error);
    return;
  }

  cb(null, true);
};

export const companyCertificateUpload = multer({
  storage: createStorage(companyCertificatesDir),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: createFileFilter(
    new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg"]),
    "Only PDF, PNG, and JPG files are allowed"
  )
});

export const chatMediaUpload = multer({
  storage: createStorage(chatMediaDir),
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: createFileFilter(
    new Set(["image/png", "image/jpeg", "image/jpg", "video/mp4", "video/webm"]),
    "Only JPG, JPEG, PNG, MP4, and WEBM files are allowed"
  )
});
