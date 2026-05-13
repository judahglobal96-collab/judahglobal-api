import { Router } from "express";
import {
  getCheckoutSessionDetails,
  createOrgSubscriptionCheckoutSession,
  createMajorEventRenewalCheckoutSession,
} from "./payments.controller";

const router = Router();

/**
 * Create Stripe checkout session for organization annual subscription
 */
router.post("/org-subscription-checkout", createOrgSubscriptionCheckoutSession);

/**
 * Get Stripe checkout session details
 * Used for confirmation / success page rendering
 */
router.get("/session/:session_id", getCheckoutSessionDetails);

router.post(
  "/promotions/major-event-renewal/checkout",
  createMajorEventRenewalCheckoutSession
);

export default router; 