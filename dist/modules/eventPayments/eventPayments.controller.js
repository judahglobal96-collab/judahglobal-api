"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrgSubscriptionCheckoutController = createOrgSubscriptionCheckoutController;
exports.createCheckoutSessionController = createCheckoutSessionController;
exports.stripeWebhookController = stripeWebhookController;
const db_1 = require("../../config/db");
const Stripe = require("stripe");
const eventPayments_model_1 = require("./eventPayments.model");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const PRICING_CENTS = {
    hero: 44900,
    homepage_top: 24900,
    discovery_top: 24900,
    featured_badge: 7900,
    major_events: 24900,
};
const ORG_SUBSCRIPTION_PRICES = {
    usa: { label: "United States", priceCents: 29900, currency: "usd" },
    canada: { label: "Canada", priceCents: 29900, currency: "usd" },
    uk: { label: "United Kingdom", priceCents: 29900, currency: "usd" },
    africa: { label: "Africa", priceCents: 14900, currency: "usd" },
};
function normalizePlacementType(type) {
    switch (type) {
        case "homepage_top":
        case "homepage_top_row":
            return "homepage_top";
        case "discovery_top":
        case "discovery_top_row":
            return "discovery_top";
        case "featured_badge":
            return "featured_badge";
        case "major_events":
            return "major_events";
        case "hero":
        default:
            return "hero";
    }
}
/* =========================
   HELPERS
========================= */
function getAuthenticatedUserId(req) {
    const user = req.user;
    return user?.id || null;
}
function normalizePromoPlacements(value) {
    if (!Array.isArray(value))
        return [];
    return value
        .map((raw) => {
        const item = raw;
        const placementType = String(item.placementType || "").trim();
        const startDate = String(item.startDate || "").trim();
        const quantity = Math.max(1, Number(item.quantity || 1));
        const durationDays = item.durationDays === undefined || item.durationDays === null
            ? null
            : Math.max(1, Number(item.durationDays));
        if (!placementType || !startDate)
            return null;
        return {
            placementType,
            startDate,
            quantity,
            durationDays,
        };
    })
        .filter(Boolean);
}
function buildPricingSummary(placements) {
    const items = placements.map((item) => {
        const normalizedType = normalizePlacementType(item.placementType);
        const unitPrice = PRICING_CENTS[normalizedType];
        return {
            ...item,
            normalizedType,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
        };
    });
    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
    return {
        items,
        total,
    };
}
/* =========================
   ORG SUBSCRIPTION CHECKOUT
========================= */
async function createOrgSubscriptionCheckoutController(req, res) {
    try {
        const { orgAccountId, orgUuid, organizationName, contactEmail, subscriptionRegion, } = req.body;
        console.log("ORG SUB CHECKOUT BODY:", req.body);
        console.log("SUBSCRIPTION REGION RECEIVED:", subscriptionRegion);
        if (!orgAccountId || !orgUuid) {
            return res.status(400).json({
                success: false,
                message: "orgAccountId and orgUuid are required.",
            });
        }
        const normalizedRegion = String(subscriptionRegion || "usa").toLowerCase();
        const regionPricing = ORG_SUBSCRIPTION_PRICES[normalizedRegion] || ORG_SUBSCRIPTION_PRICES.usa;
        const amountCents = regionPricing.priceCents;
        const currency = regionPricing.currency;
        await db_1.db.query(`
      UPDATE organization_accounts
      SET
        subscription_region = $2,
        subscription_price_cents = $3,
        subscription_currency = $4,
        subscription_status = COALESCE(subscription_status, 'pending'),
        updated_at = NOW()
      WHERE id = $1
      `, [orgAccountId, normalizedRegion, amountCents, currency]);
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/org-subscription-success?orgUuid=${orgUuid}`,
            cancel_url: `${process.env.CLIENT_URL}/register-organization`,
            client_reference_id: String(orgAccountId),
            metadata: {
                type: "org_subscription",
                orgAccountId: String(orgAccountId),
                orgUuid: String(orgUuid),
                organizationName: String(organizationName || ""),
                contactEmail: String(contactEmail || ""),
                subscriptionRegion: normalizedRegion,
                subscriptionRegionLabel: regionPricing.label,
                subscriptionPriceCents: String(amountCents),
                currency,
            },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency,
                        unit_amount: amountCents,
                        product_data: {
                            name: "Judah Global Organization Subscription",
                            description: `${regionPricing.label} annual organization subscription`,
                        },
                    },
                },
            ],
            customer_email: contactEmail || undefined,
        });
        return res.status(200).json({
            success: true,
            checkoutUrl: session.url,
            url: session.url,
            sessionId: session.id,
            region: normalizedRegion,
            amountCents,
            currency,
        });
    }
    catch (error) {
        console.error("org subscription checkout error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create organization subscription checkout session.",
        });
    }
}
/* =========================
   EVENT / CAMPAIGN CHECKOUT
========================= */
async function createCheckoutSessionController(req, res) {
    try {
        const { eventId, promoPlacements, hasFeaturedBadge, hasMajorEventAccess, isOrgAccount, } = req.body;
        const userId = getAuthenticatedUserId(req);
        if (!eventId) {
            return res.status(400).json({
                success: false,
                message: "eventId is required.",
            });
        }
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized.",
            });
        }
        const event = await (0, eventPayments_model_1.findEventSubmissionForPayment)(String(eventId));
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }
        if (event.owner_user_id && event.owner_user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied.",
            });
        }
        if (event.payment_status === "paid") {
            return res.status(400).json({
                success: false,
                message: "Event already paid.",
            });
        }
        const normalizedPlacements = normalizePromoPlacements(promoPlacements);
        const pricingSummary = buildPricingSummary(normalizedPlacements);
        const baseEventFeeCents = 7900;
        const featuredBadgeFeeCents = hasFeaturedBadge ? 7900 : 0;
        const majorEventFeeCents = hasMajorEventAccess
            ? isOrgAccount
                ? 10900
                : 24900
            : 0;
        const promoPlacementsFeeCents = pricingSummary.total;
        const totalAmountCents = baseEventFeeCents +
            featuredBadgeFeeCents +
            majorEventFeeCents +
            promoPlacementsFeeCents;
        const currency = "usd";
        await db_1.db.query(`
      UPDATE event_submissions
      SET
        pricing_total_cents = $2,
        pricing_currency = $3,
        pricing_breakdown = $4::jsonb,
        payment_amount_cents = $2,
        payment_currency = $5,
        updated_at = NOW()
      WHERE id = $1
      `, [
            eventId,
            totalAmountCents,
            currency,
            JSON.stringify({
                baseEventFeeCents,
                featuredBadgeFeeCents,
                majorEventFeeCents,
                promoPlacementsFeeCents,
                promoPlacements: pricingSummary.items,
                totalAmountCents,
            }),
            currency,
        ]);
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/payment-success`,
            cancel_url: `${process.env.CLIENT_URL}/campaign-review`,
            client_reference_id: String(eventId),
            metadata: {
                type: "event_campaign",
                eventId: String(eventId),
                userId: String(userId),
                hasFeaturedBadge: String(Boolean(hasFeaturedBadge)),
                hasMajorEventAccess: String(Boolean(hasMajorEventAccess)),
                promo_placements: JSON.stringify(pricingSummary.items),
                baseEventFeeCents: String(baseEventFeeCents),
                featuredBadgeFeeCents: String(featuredBadgeFeeCents),
                majorEventFeeCents: String(majorEventFeeCents),
                promoPlacementsFeeCents: String(promoPlacementsFeeCents),
                totalAmountCents: String(totalAmountCents),
            },
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency,
                        unit_amount: totalAmountCents,
                        product_data: {
                            name: "Judah Global Campaign",
                            description: [
                                "Event submission fee included",
                                hasFeaturedBadge ? "Featured Badge included" : null,
                                hasMajorEventAccess ? "Major Events Access included" : null,
                                pricingSummary.items.length > 0
                                    ? `${pricingSummary.items.length} promo placement item(s)`
                                    : null,
                            ]
                                .filter(Boolean)
                                .join(" • "),
                        },
                    },
                },
            ],
            customer_email: event.contact_email || undefined,
        });
        await (0, eventPayments_model_1.createPendingPayment)({
            eventId,
            amountCents: totalAmountCents,
            currency,
            checkoutSessionId: session.id,
            customerEmail: event.contact_email || null,
            paymentProvider: "stripe",
        });
        return res.status(200).json({
            success: true,
            checkoutUrl: session.url,
            url: session.url,
            sessionId: session.id,
        });
    }
    catch (error) {
        console.error("checkout error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create checkout session.",
        });
    }
}
/* =========================
   STRIPE WEBHOOK
========================= */
async function stripeWebhookController(req, res) {
    const signature = req.headers["stripe-signature"];
    try {
        const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        if (event.type === "checkout.session.completed") {
            const session = event.data.object;
            const paymentType = session.metadata?.type;
            if (paymentType === "org_subscription") {
                const orgAccountId = session.metadata?.orgAccountId || session.client_reference_id;
                if (orgAccountId) {
                    await db_1.db.query(`
            UPDATE organization_accounts
            SET
              subscription_status = 'active',
              subscription_region = COALESCE($2, subscription_region),
              subscription_price_cents = COALESCE($3, subscription_price_cents),
              subscription_currency = COALESCE($4, subscription_currency),
              subscription_checkout_session_id = $5,
              subscription_payment_intent_id = $6,
              subscription_started_at = NOW(),
              subscription_expires_at = NOW() + INTERVAL '1 year',
              updated_at = NOW()
            WHERE id = $1
            `, [
                        orgAccountId,
                        session.metadata?.subscriptionRegion || null,
                        session.metadata?.subscriptionPriceCents
                            ? Number(session.metadata.subscriptionPriceCents)
                            : null,
                        session.metadata?.currency || null,
                        session.id,
                        session.payment_intent || null,
                    ]);
                }
            }
            else {
                const eventId = session.metadata?.eventId || session.client_reference_id;
                await (0, eventPayments_model_1.markPaymentPaid)({
                    checkoutSessionId: session.id,
                    paymentIntentId: session.payment_intent || null,
                    customerEmail: session.customer_email || null,
                });
                if (eventId) {
                    await db_1.db.query(`
            UPDATE event_submissions
            SET
              status = 'pending',
              payment_status = 'paid',
              updated_at = NOW()
            WHERE id = $1
            `, [eventId]);
                }
            }
        }
        return res.status(200).json({ received: true });
    }
    catch (err) {
        console.error("stripe webhook error:", err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
}
