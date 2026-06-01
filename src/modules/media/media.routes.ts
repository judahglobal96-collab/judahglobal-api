import { Router } from "express";
import  multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads";

const uploadDir = path.join(UPLOAD_DIR, "media");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported media file type."));
    }

    cb(null, true);
  },
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const baseUrl =
      process.env.PUBLIC_API_URL ||
      `${req.protocol}://${req.get("host")}`;

    const fileUrl = `${baseUrl}/uploads/media/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      media: {
        fileUrl,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimeType: req.file.mimetype,
        fileSizeMB: Number((req.file.size / 1024 / 1024).toFixed(2)),
        mediaPurpose: req.body.mediaPurpose ?? null,
        eventId: req.body.eventId ?? null,
        sponsorId: req.body.sponsorId ?? null,
        campaignId: req.body.campaignId ?? null,
        promoPurchaseId: req.body.promoPurchaseId ?? null,
      },
    });
  } catch (error: any) {
    console.error("media upload error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to upload media.",
    });
  }
});

export default router;