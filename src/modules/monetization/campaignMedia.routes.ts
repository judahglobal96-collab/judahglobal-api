import { Router } from "express";
import {
  createCampaignMediaController,
  getPendingCampaignMediaController,
  approveCampaignMediaController,
  rejectCampaignMediaController,
  getCurrentLiveCampaignMediaController,
  getApprovedCampaignMediaController,
  getRejectedCampaignMediaController,
  getCampaignMediaHistoryController,
  getLiveCampaignMediaController,
} from "./campaignMedia.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";

const router = Router();

router.post("/", createCampaignMediaController);

router.get("/pending", getPendingCampaignMediaController);

router.post(
  "/approve",
  requireAuth,
  requireRole("admin", "sysadmin", "execsysadmin"),
  approveCampaignMediaController
);

router.post(
  "/reject",
  requireAuth,
  requireRole("admin", "sysadmin", "execsysadmin"),
  rejectCampaignMediaController
);
router.get("/current", getCurrentLiveCampaignMediaController);

router.get("/approved", getApprovedCampaignMediaController);

router.get("/rejected", getRejectedCampaignMediaController);

router.get("/history", getCampaignMediaHistoryController);

router.get("/live", getLiveCampaignMediaController);

export default router;