import { Router } from "express";
import multer from "multer";
import {
  createDraftEvent,
  submitEventForVerification,
  verifyEmailOtp,
  resendEmailOtp,
  uploadEventMedia,
} from "../controllers/eventSubmission.controller";
import { saveEventSchedule } from "../controllers/eventSchedule.controller";
import { saveEventLocation } from "../controllers/eventLocation.controller";
import { saveEventSponsor } from "../controllers/eventSponsor.controller";
import { getEventReview } from "../controllers/eventReview.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

const upload = multer({ dest: "uploads/" });

router.get("/", (_req, res) => {
  res.json({
    message: "Event submission route working... Judah Global backend live",
  });
});

router.post("/draft", requireAuth, createDraftEvent);

router.post("/events/:eventId/schedule", saveEventSchedule);
router.post("/events/:eventId/location", saveEventLocation);
router.post("/events/:eventId/sponsor", saveEventSponsor);

router.get("/events/:eventId/review", getEventReview);

router.post("/events/:eventId/submit", submitEventForVerification);
router.post("/verify-email-otp", verifyEmailOtp);
router.post("/resend-email-otp", resendEmailOtp);

router.post(
  "/:eventId/media",
  upload.single("media"),
  uploadEventMedia
);
export default router;