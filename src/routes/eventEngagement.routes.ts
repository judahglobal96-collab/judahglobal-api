import { Router } from "express";
import { trackEventEngagement } from "../controllers/eventEngagement.controller";

const router = Router();

/**
 * POST /api/v1/event-engagement/click
 * Body:
 * {
 *   "eventId": "uuid",
 *   "actionType": "click",
 *   "source": "discovery"
 * }
 */
router.post("/click", trackEventEngagement);

export default router;