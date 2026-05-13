import { Router } from "express";

import {
  createCheckoutSessionController,
  createOrgSubscriptionCheckoutController,
} from "./eventPayments.controller";

import { requireAuth } from "../../middleware/auth.middleware";

const router = Router();

/* =========================
   EVENT / CAMPAIGN CHECKOUT
========================= */

router.post(
  "/checkout-session",
  requireAuth,
  createCheckoutSessionController
);

/* =========================
   ORG SUBSCRIPTION CHECKOUT
========================= */

router.post(
  "/org-subscription-checkout",
  createOrgSubscriptionCheckoutController
);

export default router;