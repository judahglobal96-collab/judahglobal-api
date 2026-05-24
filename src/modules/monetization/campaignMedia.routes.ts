import { Router } from "express";
import {
  createCampaignMediaController,
  approveCampaignMediaController,
  rejectCampaignMediaController,
  getCurrentLiveCampaignMediaController,
} from "./campaignMedia.controller";

const router = Router();

router.post("/", createCampaignMediaController);

router.post("/approve", approveCampaignMediaController);

router.post("/reject", rejectCampaignMediaController);

router.get("/current", getCurrentLiveCampaignMediaController);

export default router;