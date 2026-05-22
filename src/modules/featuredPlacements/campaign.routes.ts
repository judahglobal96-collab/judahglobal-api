import { Router } from "express";
import multer from "multer";
import {
  checkCampaignAvailabilityController,
  getCampaignCalendarAvailabilityController,
  continueToReviewController,
  createCampaignReviewController,
  createCampaignCheckoutSessionController,
  uploadCampaignPromoMediaController,
  getCampaignPromoMediaStatusController,
  getCampaignPaymentSuccessController,
} from "./campaign.controller";
import { requireAuth } from "../../middleware/auth.middleware";

const router = Router(); 

const upload = multer({ dest: "uploads/" });


/**
 * Check live availability for selected campaign items.
 */
router.post(
  "/availability",
  requireAuth,
  checkCampaignAvailabilityController
);

/**
 * Load calendar availability for week-based placement rendering.
 */
router.post(
  "/calendar-availability",
  requireAuth,
  getCampaignCalendarAvailabilityController
);

/**
 * Save builder payload and create a campaign review record.
 * Primary builder -> review endpoint.
 */
router.post(
  "/review",
  requireAuth,
  continueToReviewController
);

/**
 * Temporary backward-compatible alias for older frontend code.
 * Remove after all clients use /review.
 */
router.post(
  "/reserve",
  requireAuth,
  continueToReviewController
);

/**
 * Load a saved campaign review by campaignId.
 */
router.post(
  "/create-review",
  requireAuth,
  createCampaignReviewController
);

/**
 * Create Stripe checkout session for a saved campaign.
 */
router.post(
  "/create-checkout-session",
  requireAuth,
  createCampaignCheckoutSessionController
);

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

router.post(
  "/promo-media/upload",
  requireAuth,
  upload.single("promoMedia"),
  uploadCampaignPromoMediaController
);

router.get(
  "/promo-media/status",
  requireAuth,
  getCampaignPromoMediaStatusController
);

router.get(
  "/payment-success",
  getCampaignPaymentSuccessController
);

export default router;