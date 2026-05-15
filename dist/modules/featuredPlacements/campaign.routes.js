"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const campaign_controller_1 = require("./campaign.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * Check live availability for selected campaign items.
 */
router.post("/availability", auth_middleware_1.requireAuth, campaign_controller_1.checkCampaignAvailabilityController);
/**
 * Load calendar availability for week-based placement rendering.
 */
router.post("/calendar-availability", auth_middleware_1.requireAuth, campaign_controller_1.getCampaignCalendarAvailabilityController);
/**
 * Save builder payload and create a campaign review record.
 * Primary builder -> review endpoint.
 */
router.post("/review", auth_middleware_1.requireAuth, campaign_controller_1.continueToReviewController);
/**
 * Temporary backward-compatible alias for older frontend code.
 * Remove after all clients use /review.
 */
router.post("/reserve", auth_middleware_1.requireAuth, campaign_controller_1.continueToReviewController);
/**
 * Load a saved campaign review by campaignId.
 */
router.post("/create-review", auth_middleware_1.requireAuth, campaign_controller_1.createCampaignReviewController);
/**
 * Create Stripe checkout session for a saved campaign.
 */
router.post("/create-checkout-session", auth_middleware_1.requireAuth, campaign_controller_1.createCampaignCheckoutSessionController);
/**
 * Upload promo media for a campaign placement.
 * Frontend should send multipart/form-data with:
 * - campaignId
 * - placementType
 * - optional campaignItemId
 * - upload_type = campaign_promo
 * - file field name: promoMedia
 */
/**
 * Load promo media moderation/render status for a campaign placement.
 * Can be queried by campaignId + placementType, with optional campaignItemId.
 */
router.get("/promo-media/status", auth_middleware_1.requireAuth, campaign_controller_1.getCampaignPromoMediaStatusController);
router.get("/payment-success", campaign_controller_1.getCampaignPaymentSuccessController);
exports.default = router;
