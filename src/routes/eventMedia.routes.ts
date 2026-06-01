import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { uploadEventMedia } from "../uploads/events/middleware/uploadEventMedia";
import { uploadEventMediaController } from "../uploads/events/controllers/eventMedia.controller";

const router = Router();

router.post(
  "/:eventId/media",
  requireAuth,
  uploadEventMedia.single("media"),
  uploadEventMediaController
);

export default router;