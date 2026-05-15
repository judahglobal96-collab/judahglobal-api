"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payments_controller_1 = require("./payments.controller");
const router = (0, express_1.Router)();
/**
 * Create Stripe checkout session for organization annual subscription
 */
router.post("/org-subscription-checkout", payments_controller_1.createOrgSubscriptionCheckoutSession);
/**
 * Get Stripe checkout session details
 * Used for confirmation / success page rendering
 */
router.get("/session/:session_id", payments_controller_1.getCheckoutSessionDetails);
router.post("/promotions/major-event-renewal/checkout", payments_controller_1.createMajorEventRenewalCheckoutSession);
exports.default = router;
