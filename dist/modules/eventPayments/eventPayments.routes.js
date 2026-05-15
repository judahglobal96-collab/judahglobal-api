"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventPayments_controller_1 = require("./eventPayments.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
/* =========================
   EVENT / CAMPAIGN CHECKOUT
========================= */
router.post("/checkout-session", auth_middleware_1.requireAuth, eventPayments_controller_1.createCheckoutSessionController);
/* =========================
   ORG SUBSCRIPTION CHECKOUT
========================= */
router.post("/org-subscription-checkout", eventPayments_controller_1.createOrgSubscriptionCheckoutController);
exports.default = router;
