"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const db_1 = require("../../config/db");
const placementReservation_service_1 = require("./services/placementReservation.service");
const promotionSync_service_1 = require("../../services/promotionSync.service");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
});
async function logEventAction({ eventId, eventCode = null, actionType, actionStatus, actorUserId = null, actorRole = null, message = null, errorDetail = null, metadata = null, }) {
    try {
        await db_1.db.query(`
      INSERT INTO event_action_logs (
        event_id,
        event_code,
        action_type,
        action_status,
        actor_user_id,
        actor_role,
        message,
        error_detail,
        metadata,
        created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        COALESCE($9::jsonb, '{}'::jsonb),
        NOW()
      )
      `, [
            eventId,
            eventCode,
            actionType,
            actionStatus,
            actorUserId,
            actorRole,
            message,
            errorDetail,
            metadata ? JSON.stringify(metadata) : null,
        ]);
    }
    catch (logError) {
        console.error("Failed to write event_action_logs row:", logError);
    }
}
async function getEventCode(eventId) {
    try {
        const result = await db_1.db.query(`
      SELECT event_code
      FROM event_submissions
      WHERE id = $1
      LIMIT 1
      `, [eventId]);
        return result.rows[0]?.event_code ?? null;
    }
    catch (error) {
        console.error("Failed to fetch event code for webhook log:", error);
        return null;
    }
}
function resolveEventIdFromCheckoutSession(session) {
    return (session.metadata?.eventId ||
        session.metadata?.event_id ||
        session.client_reference_id ||
        null);
}
function resolveUserIdFromCheckoutSession(session) {
    return session.metadata?.userId || session.metadata?.user_id || null;
}
function resolvePaymentTypeFromCheckoutSession(session) {
    return session.metadata?.payment_type || "event_fee";
}
function resolveEventIdFromPaymentIntent(paymentIntent) {
    return paymentIntent.metadata?.eventId || paymentIntent.metadata?.event_id || null;
}
function resolveUserIdFromPaymentIntent(paymentIntent) {
    return paymentIntent.metadata?.userId || paymentIntent.metadata?.user_id || null;
}
function resolvePaymentTypeFromPaymentIntent(paymentIntent) {
    return paymentIntent.metadata?.payment_type || "event_fee";
}
function resolvePurchaseTypeFromCheckoutSession(session) {
    return session.metadata?.purchaseType || session.metadata?.purchase_type || null;
}
function resolveCampaignIdFromCheckoutSession(session) {
    return session.metadata?.campaign_id || null;
}
function resolvePlacementHoldSessionIdFromCheckoutSession(session) {
    return (session.metadata?.placement_hold_session_id ||
        session.metadata?.hold_session_id ||
        session.metadata?.placementHoldSessionId ||
        null);
}
function resolveOrgAccountIdFromCheckoutSession(session) {
    return session.metadata?.orgAccountId || null;
}
function resolveOrgUuidFromCheckoutSession(session) {
    return session.metadata?.orgUuid || null;
}
function isPlacementPromoPurchase(session) {
    const purchaseType = resolvePurchaseTypeFromCheckoutSession(session);
    const paymentType = resolvePaymentTypeFromCheckoutSession(session);
    return (purchaseType === "placement_promo" ||
        purchaseType === "promo_placement" ||
        purchaseType === "placement" ||
        paymentType === "placement_promo" ||
        paymentType === "promo_placement" ||
        paymentType === "placement");
}
async function resolveLinkedEventIdForCampaign(campaignId) {
    try {
        const result = await db_1.db.query(`
      SELECT linked_event_id
      FROM ad_campaigns
      WHERE id = $1
      LIMIT 1
      `, [campaignId]);
        return result.rows?.[0]?.linked_event_id ?? null;
    }
    catch (error) {
        console.error("Failed to resolve linked event for campaign:", error);
        return null;
    }
}
async function extendMajorEventPromotion(params) {
    const { eventId, purchaseType } = params;
    await db_1.db.query(`
    INSERT INTO event_promotions (
      event_id,
      placement_type,
      purchase_type,
      starts_at,
      expires_at,
      status
    )
    VALUES (
      $1,
      'major_event',
      $2,
      NOW(),
      NOW() + INTERVAL '21 days',
      'active'
    )
    ON CONFLICT (event_id, placement_type)
    DO UPDATE SET
      expires_at = GREATEST(event_promotions.expires_at, NOW()) + INTERVAL '21 days',
      purchase_type = $2,
      status = 'active',
      updated_at = NOW()
    `, [eventId, purchaseType]);
}
async function activateOrganizationSubscription(params) {
    const { orgAccountId, orgUuid, session } = params;
    await db_1.db.query("BEGIN");
    try {
        await db_1.db.query(`
      UPDATE organization_accounts
      SET
        subscription_status = 'active',
        subscription_expires_at = NOW() + INTERVAL '1 year',
        status = 'active',
        verification_status = 'verified',
        updated_at = NOW()
      WHERE id = $1
      `, [orgAccountId]);
        await db_1.db.query("COMMIT");
        console.log("Organization subscription activated:", {
            orgAccountId,
            orgUuid,
            sessionId: session.id,
        });
    }
    catch (error) {
        await db_1.db.query("ROLLBACK");
        throw error;
    }
}
async function upsertSuccessfulEventPayment(params) {
    const { eventId, session } = params;
    const checkoutSessionId = session.id ?? null;
    const paymentIntentId = session.payment_intent
        ? String(session.payment_intent)
        : null;
    const amountCents = session.amount_total ?? 0;
    const currency = session.currency ?? "usd";
    const customerEmail = session.customer_details?.email ||
        (typeof session.customer_email === "string" ? session.customer_email : null);
    const existing = await db_1.db.query(`
    SELECT id
    FROM event_payments
    WHERE
      ($1::text IS NOT NULL AND checkout_session_id = $1)
      OR
      ($2::text IS NOT NULL AND payment_intent_id = $2)
    LIMIT 1
    `, [checkoutSessionId, paymentIntentId]);
    if (existing.rowCount && existing.rows[0]?.id) {
        await db_1.db.query(`
      UPDATE event_payments
      SET
        event_id = $2,
        amount_cents = $3,
        currency = $4,
        payment_status = 'paid',
        payment_provider = 'stripe',
        checkout_session_id = $5,
        payment_intent_id = $6,
        customer_email = $7,
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `, [
            existing.rows[0].id,
            eventId,
            amountCents,
            currency,
            checkoutSessionId,
            paymentIntentId,
            customerEmail,
        ]);
        return;
    }
    await db_1.db.query(`
    INSERT INTO event_payments (
      event_id,
      payment_status,
      payment_provider,
      amount_cents,
      currency,
      checkout_session_id,
      payment_intent_id,
      customer_email,
      paid_at,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      'paid',
      'stripe',
      $2,
      $3,
      $4,
      $5,
      $6,
      NOW(),
      NOW(),
      NOW()
    )
    `, [
        eventId,
        amountCents,
        currency,
        checkoutSessionId,
        paymentIntentId,
        customerEmail,
    ]);
}
async function upsertFailedEventPayment(params) {
    const { eventId, paymentIntent } = params;
    const paymentIntentId = paymentIntent.id ?? null;
    const amountCents = paymentIntent.amount ?? 0;
    const currency = paymentIntent.currency ?? "usd";
    const customerEmail = typeof paymentIntent.receipt_email === "string"
        ? paymentIntent.receipt_email
        : null;
    const existing = await db_1.db.query(`
    SELECT id
    FROM event_payments
    WHERE payment_intent_id = $1
    LIMIT 1
    `, [paymentIntentId]);
    if (existing.rowCount && existing.rows[0]?.id) {
        await db_1.db.query(`
      UPDATE event_payments
      SET
        event_id = $2,
        amount_cents = $3,
        currency = $4,
        payment_status = 'failed',
        payment_provider = 'stripe',
        payment_intent_id = $5,
        customer_email = COALESCE($6, customer_email),
        failed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `, [
            existing.rows[0].id,
            eventId,
            amountCents,
            currency,
            paymentIntentId,
            customerEmail,
        ]);
        return;
    }
    await db_1.db.query(`
    INSERT INTO event_payments (
      event_id,
      payment_status,
      payment_provider,
      amount_cents,
      currency,
      checkout_session_id,
      payment_intent_id,
      customer_email,
      failed_at,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      'failed',
      'stripe',
      $2,
      $3,
      NULL,
      $4,
      $5,
      NOW(),
      NOW(),
      NOW()
    )
    `, [eventId, amountCents, currency, paymentIntentId, customerEmail]);
}
async function markCampaignPaid(params) {
    const { campaignId } = params;
    await db_1.db.query("BEGIN");
    try {
        await db_1.db.query(`
      UPDATE ad_campaigns
      SET
        status = 'paid',
        updated_at = NOW()
      WHERE id = $1
      `, [campaignId]);
        await db_1.db.query(`
      UPDATE ad_campaign_items
      SET status = 'paid'
      WHERE campaign_id = $1
      `, [campaignId]);
        const campaignResult = await db_1.db.query(`
      SELECT linked_event_id
      FROM ad_campaigns
      WHERE id = $1
      LIMIT 1
      `, [campaignId]);
        const linkedEventId = campaignResult.rows[0]?.linked_event_id;
        if (linkedEventId) {
            const placementResult = await db_1.db.query(`
        SELECT placement_type
        FROM ad_campaign_items
        WHERE campaign_id = $1
          AND status = 'paid'
        `, [campaignId]);
            const placementTypes = placementResult.rows.map((row) => row.placement_type);
            await db_1.db.query(`
        UPDATE event_submissions
        SET
          is_major_event = CASE
            WHEN $2::boolean THEN TRUE
            ELSE is_major_event
          END,
          has_featured_badge = CASE
            WHEN $3::boolean THEN TRUE
            ELSE has_featured_badge
          END,
          featured = CASE
            WHEN $3::boolean THEN TRUE
            ELSE featured
          END,
          updated_at = NOW()
        WHERE id = $1
        `, [
                linkedEventId,
                placementTypes.includes("major_events"),
                placementTypes.includes("featured_badge"),
            ]);
            if (placementTypes.includes("major_events")) {
                await extendMajorEventPromotion({
                    eventId: linkedEventId,
                    purchaseType: "initial",
                });
            }
        }
        await (0, promotionSync_service_1.syncCampaignPromotionFlags)(campaignId);
        await db_1.db.query("COMMIT");
    }
    catch (error) {
        await db_1.db.query("ROLLBACK");
        throw error;
    }
}
async function markCampaignExpired(campaignId) {
    await db_1.db.query(`
    UPDATE ad_campaigns
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE id = $1
    `, [campaignId]);
    await db_1.db.query(`
    UPDATE ad_campaign_items
    SET status = 'expired'
    WHERE campaign_id = $1
      AND status IN ('reserved', 'pending_payment')
    `, [campaignId]);
}
async function markLinkedEventPaidFromCampaign(params) {
    const { eventId, userId, session } = params;
    const eventCode = await getEventCode(eventId);
    await db_1.db.query("BEGIN");
    try {
        await db_1.db.query(`
      UPDATE event_submissions
      SET
        status = 'pending',
        payment_status = 'paid',
        payment_provider = 'stripe',
        payment_reference = $2,
        payment_amount_cents = $3,
        payment_currency = $4,
        payment_paid_at = NOW(),
        payment_updated_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `, [
            eventId,
            session.payment_intent ? String(session.payment_intent) : session.id,
            session.amount_total ?? null,
            session.currency ?? null,
        ]);
        await upsertSuccessfulEventPayment({
            eventId,
            eventCode,
            session,
        });
        await logEventAction({
            eventId,
            eventCode,
            actionType: "campaign_payment_succeeded",
            actionStatus: "success",
            actorUserId: userId,
            actorRole: "system",
            message: "Campaign payment completed and linked event moved to pending review",
            metadata: {
                source: "stripe_webhook",
                provider: "stripe",
                checkout_session_id: session.id ?? null,
                payment_intent_id: session.payment_intent ?? null,
                amount_total: session.amount_total ?? null,
                currency: session.currency ?? null,
                purchase_type: "campaign",
            },
        });
        await db_1.db.query("COMMIT");
    }
    catch (error) {
        await db_1.db.query("ROLLBACK");
        throw error;
    }
}
const stripeWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        return res.status(400).send("Missing Stripe signature");
    }
    let stripeEvent;
    try {
        stripeEvent = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        switch (stripeEvent.type) {
            case "checkout.session.completed": {
                const session = stripeEvent.data.object;
                const purchaseType = resolvePurchaseTypeFromCheckoutSession(session);
                const campaignId = resolveCampaignIdFromCheckoutSession(session);
                const orgAccountId = resolveOrgAccountIdFromCheckoutSession(session);
                const orgUuid = resolveOrgUuidFromCheckoutSession(session);
                let eventId = resolveEventIdFromCheckoutSession(session);
                const userId = resolveUserIdFromCheckoutSession(session);
                const placementHoldSessionId = resolvePlacementHoldSessionIdFromCheckoutSession(session);
                const placementPromo = isPlacementPromoPurchase(session);
                if (purchaseType === "org_subscription" && orgAccountId) {
                    try {
                        await activateOrganizationSubscription({
                            orgAccountId: String(orgAccountId),
                            orgUuid: orgUuid ? String(orgUuid) : null,
                            session,
                        });
                    }
                    catch (orgError) {
                        console.error("Organization subscription webhook DB update failed:", orgError);
                        return res
                            .status(500)
                            .send("Organization subscription webhook handler failed");
                    }
                    break;
                }
                if (purchaseType === "major_event_renewal" && eventId) {
                    try {
                        const resolvedEventId = String(eventId);
                        const eventCode = await getEventCode(resolvedEventId);
                        await db_1.db.query("BEGIN");
                        await extendMajorEventPromotion({
                            eventId: resolvedEventId,
                            purchaseType: "renewal",
                        });
                        await db_1.db.query(`
              UPDATE event_submissions
              SET
                is_major_event = TRUE,
                payment_provider = 'stripe',
                payment_reference = $2,
                payment_updated_at = NOW(),
                updated_at = NOW()
              WHERE id = $1
              `, [
                            resolvedEventId,
                            session.payment_intent
                                ? String(session.payment_intent)
                                : session.id,
                        ]);
                        await upsertSuccessfulEventPayment({
                            eventId: resolvedEventId,
                            eventCode,
                            session,
                        });
                        await logEventAction({
                            eventId: resolvedEventId,
                            eventCode,
                            actionType: "major_event_renewal_payment_succeeded",
                            actionStatus: "success",
                            actorUserId: userId ? String(userId) : null,
                            actorRole: "system",
                            message: "Major Event placement extended by 21 days",
                            metadata: {
                                source: "stripe_webhook",
                                provider: "stripe",
                                purchase_type: "major_event_renewal",
                                checkout_session_id: session.id ?? null,
                                payment_intent_id: session.payment_intent ?? null,
                                amount_total: session.amount_total ?? null,
                                currency: session.currency ?? null,
                            },
                        });
                        await db_1.db.query("COMMIT");
                    }
                    catch (renewalError) {
                        await db_1.db.query("ROLLBACK");
                        console.error("Major Event renewal webhook failed:", renewalError);
                        return res.status(500).send("Major Event renewal webhook handler failed");
                    }
                    break;
                }
                if (purchaseType === "campaign" && campaignId) {
                    try {
                        await markCampaignPaid({
                            campaignId: String(campaignId),
                            session,
                        });
                        if (!eventId) {
                            eventId = await resolveLinkedEventIdForCampaign(String(campaignId));
                        }
                        if (eventId) {
                            await markLinkedEventPaidFromCampaign({
                                eventId: String(eventId),
                                userId: userId ? String(userId) : null,
                                session,
                            });
                        }
                        else {
                            console.warn("Campaign payment succeeded but no linked event could be resolved.", {
                                campaignId,
                                sessionId: session.id,
                            });
                        }
                    }
                    catch (campaignError) {
                        console.error("Campaign payment webhook DB update failed:", campaignError);
                        return res.status(500).send("Campaign webhook handler failed");
                    }
                    break;
                }
                if (placementPromo) {
                    if (!placementHoldSessionId) {
                        console.warn("Placement promo checkout.session.completed received without placement hold session metadata");
                        break;
                    }
                    try {
                        await (0, placementReservation_service_1.convertHoldSessionToReservations)({
                            holdSessionId: String(placementHoldSessionId),
                            checkoutSessionId: session.id,
                            stripePaymentIntentId: session.payment_intent
                                ? String(session.payment_intent)
                                : null,
                        });
                    }
                    catch (placementError) {
                        console.error("Placement promo conversion failed:", placementError);
                        return res.status(500).send("Placement promo conversion failed");
                    }
                    break;
                }
                if (!eventId) {
                    console.warn("Stripe checkout.session.completed received without eventId metadata/client_reference_id");
                    break;
                }
                const eventCode = await getEventCode(String(eventId));
                try {
                    await db_1.db.query("BEGIN");
                    await db_1.db.query(`
            UPDATE event_submissions
            SET
              status = 'pending',
              payment_status = 'paid',
              payment_provider = 'stripe',
              payment_reference = $2,
              payment_amount_cents = $3,
              payment_currency = $4,
              payment_paid_at = NOW(),
              payment_updated_at = NOW(),
              updated_at = NOW()
            WHERE id = $1
            `, [
                        String(eventId),
                        session.payment_intent ? String(session.payment_intent) : session.id,
                        session.amount_total ?? null,
                        session.currency ?? null,
                    ]);
                    await upsertSuccessfulEventPayment({
                        eventId: String(eventId),
                        eventCode,
                        session,
                    });
                    await logEventAction({
                        eventId: String(eventId),
                        eventCode,
                        actionType: "payment_succeeded",
                        actionStatus: "success",
                        actorUserId: userId ? String(userId) : null,
                        actorRole: "system",
                        message: "Stripe payment completed successfully",
                        metadata: {
                            source: "stripe_webhook",
                            provider: "stripe",
                            event_type: stripeEvent.type,
                            checkout_session_id: session.id ?? null,
                            payment_intent_id: session.payment_intent ?? null,
                            amount_total: session.amount_total ?? null,
                            currency: session.currency ?? null,
                            payment_status: session.payment_status ?? null,
                            payment_type: resolvePaymentTypeFromCheckoutSession(session),
                            purchase_type: purchaseType,
                            client_reference_id: session.client_reference_id ?? null,
                        },
                    });
                    await db_1.db.query("COMMIT");
                }
                catch (dbError) {
                    await db_1.db.query("ROLLBACK");
                    console.error("DB update failed:", dbError);
                    await logEventAction({
                        eventId: String(eventId),
                        eventCode,
                        actionType: "payment_succeeded",
                        actionStatus: "failed",
                        actorUserId: userId ? String(userId) : null,
                        actorRole: "system",
                        message: "Stripe webhook received but DB update failed",
                        errorDetail: dbError?.message ?? "Unknown DB update error",
                        metadata: {
                            source: "stripe_webhook",
                            provider: "stripe",
                            event_type: stripeEvent.type,
                            checkout_session_id: session.id ?? null,
                            payment_intent_id: session.payment_intent ?? null,
                            payment_type: resolvePaymentTypeFromCheckoutSession(session),
                            purchase_type: purchaseType,
                        },
                    });
                }
                break;
            }
            case "payment_intent.payment_failed": {
                const paymentIntent = stripeEvent.data.object;
                const eventId = resolveEventIdFromPaymentIntent(paymentIntent);
                const userId = resolveUserIdFromPaymentIntent(paymentIntent);
                if (!eventId) {
                    console.warn("Stripe payment_intent.payment_failed received without eventId metadata");
                    break;
                }
                const eventCode = await getEventCode(String(eventId));
                try {
                    await db_1.db.query("BEGIN");
                    await db_1.db.query(`
            UPDATE event_submissions
            SET
              payment_status = 'failed',
              payment_provider = 'stripe',
              payment_reference = $2,
              payment_failed_at = NOW(),
              payment_updated_at = NOW(),
              updated_at = NOW()
            WHERE id = $1
            `, [String(eventId), paymentIntent.id]);
                    await upsertFailedEventPayment({
                        eventId: String(eventId),
                        eventCode,
                        paymentIntent,
                    });
                    await logEventAction({
                        eventId: String(eventId),
                        eventCode,
                        actionType: "payment_failed",
                        actionStatus: "failed",
                        actorUserId: userId ? String(userId) : null,
                        actorRole: "system",
                        message: "Stripe payment failed",
                        errorDetail: paymentIntent.last_payment_error?.message ?? "Unknown payment failure",
                        metadata: {
                            source: "stripe_webhook",
                            provider: "stripe",
                            event_type: stripeEvent.type,
                            payment_intent_id: paymentIntent.id ?? null,
                            amount: paymentIntent.amount ?? null,
                            currency: paymentIntent.currency ?? null,
                            status: paymentIntent.status ?? null,
                            payment_type: resolvePaymentTypeFromPaymentIntent(paymentIntent),
                            error_code: paymentIntent.last_payment_error?.code ?? null,
                        },
                    });
                    await db_1.db.query("COMMIT");
                }
                catch (dbError) {
                    await db_1.db.query("ROLLBACK");
                    console.error("DB update failed for payment failure webhook:", dbError);
                    await logEventAction({
                        eventId: String(eventId),
                        eventCode,
                        actionType: "payment_failed",
                        actionStatus: "failed",
                        actorUserId: userId ? String(userId) : null,
                        actorRole: "system",
                        message: "Stripe payment failure webhook received but DB update failed",
                        errorDetail: dbError?.message ?? "Unknown DB update error",
                        metadata: {
                            source: "stripe_webhook",
                            provider: "stripe",
                            event_type: stripeEvent.type,
                            payment_intent_id: paymentIntent.id ?? null,
                            payment_type: resolvePaymentTypeFromPaymentIntent(paymentIntent),
                        },
                    });
                }
                break;
            }
            case "checkout.session.expired": {
                const session = stripeEvent.data.object;
                const purchaseType = resolvePurchaseTypeFromCheckoutSession(session);
                const campaignId = resolveCampaignIdFromCheckoutSession(session);
                let eventId = resolveEventIdFromCheckoutSession(session);
                const userId = resolveUserIdFromCheckoutSession(session);
                const placementHoldSessionId = resolvePlacementHoldSessionIdFromCheckoutSession(session);
                const placementPromo = isPlacementPromoPurchase(session);
                if (purchaseType === "campaign" && campaignId) {
                    try {
                        await markCampaignExpired(String(campaignId));
                        if (!eventId) {
                            eventId = await resolveLinkedEventIdForCampaign(String(campaignId));
                        }
                        if (eventId) {
                            await db_1.db.query(`
                UPDATE event_submissions
                SET
                  payment_status = 'expired',
                  payment_updated_at = NOW(),
                  updated_at = NOW()
                WHERE id = $1
                `, [String(eventId)]);
                            await logEventAction({
                                eventId: String(eventId),
                                eventCode: await getEventCode(String(eventId)),
                                actionType: "campaign_checkout_expired",
                                actionStatus: "failed",
                                actorUserId: userId ? String(userId) : null,
                                actorRole: "system",
                                message: "Campaign checkout expired before payment completed",
                                metadata: {
                                    source: "stripe_webhook",
                                    provider: "stripe",
                                    campaign_id: campaignId,
                                    checkout_session_id: session.id ?? null,
                                },
                            });
                        }
                    }
                    catch (updateError) {
                        console.error("Failed to update campaign for expired checkout:", updateError);
                    }
                    break;
                }
                if (placementPromo && placementHoldSessionId) {
                    try {
                        await db_1.db.query(`
              UPDATE placement_hold_sessions
              SET
                status = 'expired',
                updated_at = NOW()
              WHERE id = $1
                AND status = 'active'
              `, [String(placementHoldSessionId)]);
                        await db_1.db.query(`
              UPDATE placement_hold_items
              SET
                status = 'expired',
                updated_at = NOW()
              WHERE hold_session_id = $1
                AND status = 'active'
              `, [String(placementHoldSessionId)]);
                    }
                    catch (updateError) {
                        console.error("Failed to expire placement hold session:", updateError);
                    }
                    break;
                }
                if (!eventId) {
                    console.warn("Stripe checkout.session.expired received without eventId metadata/client_reference_id");
                    break;
                }
                const eventCode = await getEventCode(String(eventId));
                try {
                    await db_1.db.query(`
            UPDATE event_submissions
            SET
              payment_status = 'expired',
              payment_updated_at = NOW(),
              updated_at = NOW()
            WHERE id = $1
            `, [String(eventId)]);
                }
                catch (updateError) {
                    console.error("Failed to update event_submissions for expired checkout:", updateError);
                }
                await logEventAction({
                    eventId: String(eventId),
                    eventCode,
                    actionType: "checkout_session_expired",
                    actionStatus: "failed",
                    actorUserId: userId ? String(userId) : null,
                    actorRole: "system",
                    message: "Stripe checkout session expired before payment completed",
                    metadata: {
                        source: "stripe_webhook",
                        provider: "stripe",
                        event_type: stripeEvent.type,
                        checkout_session_id: session.id ?? null,
                        payment_status: session.payment_status ?? null,
                        payment_type: resolvePaymentTypeFromCheckoutSession(session),
                        purchase_type: purchaseType,
                        status: session.status ?? null,
                    },
                });
                break;
            }
            default:
                console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
                break;
        }
        return res.json({ received: true });
    }
    catch (error) {
        console.error("Webhook processing error:", error);
        return res.status(500).send("Webhook handler failed");
    }
};
exports.stripeWebhook = stripeWebhook;
