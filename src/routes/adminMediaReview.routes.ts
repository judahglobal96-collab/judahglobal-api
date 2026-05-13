import { Router } from "express";
import {
  getPendingMediaReviews,
  getApprovedMediaReviews,
  getRejectedMediaReviews,
  approveMediaReview,
  rejectMediaReview,
  getMediaReviewEventDetail,
} from "../controllers/adminMediaReview.controller";

const router = Router();

router.get("/pending", getPendingMediaReviews);
router.get("/approved", getApprovedMediaReviews);
router.get("/rejected", getRejectedMediaReviews);

router.patch("/:mediaId/approve", approveMediaReview);
router.patch("/:mediaId/reject", rejectMediaReview);

router.get("/event/:eventId", getMediaReviewEventDetail);

export default router;