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

const router = Router();

router.post("/", createCampaignMediaController);

router.get("/pending", getPendingCampaignMediaController);

router.post("/approve", approveCampaignMediaController);

router.post("/reject", rejectCampaignMediaController);

router.get("/current", getCurrentLiveCampaignMediaController);

router.get("/approved", getApprovedCampaignMediaController);

router.get("/rejected", getRejectedCampaignMediaController);

router.get("/history", getCampaignMediaHistoryController);

router.get("/live", getLiveCampaignMediaController);

export default router;