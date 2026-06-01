import { Router } from "express";
import { uploadEventMedia } from "../uploads/events/middleware/uploadEventMedia";
import { uploadEventMediaController } from "../uploads/events/controllers/eventMedia.controller";

const router = Router();

router.post(
  "/:eventId/media",
  uploadEventMedia.single("media"),
  uploadEventMediaController
);

export default router;