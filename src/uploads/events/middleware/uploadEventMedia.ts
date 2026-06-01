import multer from "multer";
import path from "path";
import fs from "fs";
import type { Request } from "express";

const uploadRoot = process.env.UPLOAD_DIR || "/app/uploads";
const sponsorDir = path.join(uploadRoot, "sponsors");
const eventDir = path.join(uploadRoot, "events");
const campaignDir = path.join(uploadRoot, "campaigns");

[sponsorDir, eventDir, campaignDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const uploadType = String(req.body.upload_type || "event_media").toLowerCase();

    if (uploadType === "sponsor_logo") {
      cb(null, sponsorDir);
      return;
    }

    if (uploadType === "campaign_promo") {
      cb(null, campaignDir);
      return;
    }

    cb(null, eventDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();

    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/svg+xml",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error("Only JPG, JPEG, PNG, WEBP, and SVG images are allowed."));
};

export const uploadEventMedia = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});