"use strict";
// LEGACY FEATURED PLACEMENT MODULE
// Retained temporarily for backward compatibility.
// New monetization flow should use campaign.* modules.
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const featuredPlacement_controller_1 = require("./featuredPlacement.controller");
const router = (0, express_1.Router)();
router.get("/available", featuredPlacement_controller_1.getAvailableFeaturedPlacementsController);
router.get("/availability", featuredPlacement_controller_1.getCampaignAvailabilityController);
router.post("/reserve", auth_middleware_1.requireAuth, featuredPlacement_controller_1.reserveFeaturedPlacementController);
router.post("/reserve-campaign", auth_middleware_1.requireAuth, featuredPlacement_controller_1.autoAssignAndReserveCampaignController);
exports.default = router;
