import { Router } from "express";
import {
  getPendingEventMedia,
  approveEventMedia,
  rejectEventMedia,
} from "../uploads/events/controllers/eventMediaModeration.controller";

// Optional: import your admin auth middleware if you have one
// import { requireAdmin } from "../middleware/requireAdmin";

const router = Router();

/**
 * GET all pending media for admin review
 */
router.get(
  "/pending",
  // requireAdmin,
  getPendingEventMedia
);

/**
 * Approve media
 */
router.patch(
  "/:mediaId/approve",
  // requireAdmin,
  approveEventMedia
);

/**
 * Reject media
 */
router.patch(
  "/:mediaId/reject",
  // requireAdmin,
  rejectEventMedia
);

export default router;