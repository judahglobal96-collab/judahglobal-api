// LEGACY FEATURED PLACEMENT MODULE
// Retained temporarily for backward compatibility.
// New monetization flow should use campaign.* modules.

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  autoAssignAndReserveCampaignController,
  getAvailableFeaturedPlacementsController,
  getCampaignAvailabilityController,
  reserveFeaturedPlacementController,
} from "./featuredPlacement.controller";

const router = Router();

router.get("/available", getAvailableFeaturedPlacementsController);
router.get("/availability", getCampaignAvailabilityController);

router.post("/reserve", requireAuth, reserveFeaturedPlacementController);
router.post("/reserve-campaign", requireAuth, autoAssignAndReserveCampaignController);

export default router;