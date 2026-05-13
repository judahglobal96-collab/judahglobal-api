import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getMyEvents,
  getMyEventMetadataForEdit,
  updateMyEventMetadata,
} from "./account.controller";

const router = Router();

router.get("/my-events", requireAuth, getMyEvents);
router.get("/events/:eventId/edit", requireAuth, getMyEventMetadataForEdit);
router.patch("/events/:eventId/metadata", requireAuth, updateMyEventMetadata);

export default router;