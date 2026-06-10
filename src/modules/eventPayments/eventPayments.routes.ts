import { Router } from "express";

import {
  createCheckoutSessionController,
  createOrgSubscriptionCheckoutController,
} from "./eventPayments.controller";

import { requireAuth } from "../../middleware/auth.middleware";
import { getEventPayments } from "../../controllers/adminEventPayments.controller";

const router = Router();

router.get("/", getEventPayments);

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