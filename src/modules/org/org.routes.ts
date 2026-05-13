import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getMyOrganization,
  getOrgApprovedEvents,
  getOrgEventMetadataForEdit,
  updateOrgEventMetadata,
} from "./org.controller";
import { getOrganizationAccountByUuidForPortal } from "../admin/orgAccounts/orgAccounts.controller";
import { submitEventForReview } from "../../controllers/orgEventSubmission.controller";

const router = Router();

router.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Org routes are mounted",
  });
});

router.get("/me", requireAuth, getMyOrganization);
router.get("/:orgUuid/approved-events", requireAuth, getOrgApprovedEvents);

router.post(
  "/:orgUuid/submit-event/review",
  requireAuth,
  submitEventForReview
);

router.get(
  "/:orgUuid/events/:eventId/edit",
  requireAuth,
  getOrgEventMetadataForEdit
);

router.patch(
  "/:orgUuid/events/:eventId/metadata",
  requireAuth,
  updateOrgEventMetadata
);

router.get("/:orgUuid", requireAuth, getOrganizationAccountByUuidForPortal);

export default router;