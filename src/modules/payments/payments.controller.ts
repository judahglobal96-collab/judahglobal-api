import { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../../config/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2026-02-25.clover',
});

const ORG_SUBSCRIPTION_PRICES: Record<
  string,
  { label: string; priceCents: number; currency: string }
> = {
  usa: { label: 'United States', priceCents: 29900, currency: 'usd' },
  canada: { label: 'Canada', priceCents: 29900, currency: 'usd' },
  uk: { label: 'United Kingdom', priceCents: 29900, currency: 'usd' },
  africa: { label: 'Africa', priceCents: 14900, currency: 'usd' },
};

export const getCheckoutSessionDetails = async (req: Request, res: Response) => {
  try {
    
    const sessionId = String(req.params.session_id || "");

    if (!sessionId) {
      return res.status(400).json({ message: 'Missing session_id' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const metadata = session.metadata || {};

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        amount_total: session.amount_total,
        currency: session.currency,
        payment_status: session.payment_status,
        eventId: metadata.eventId || null,
        userId: metadata.userId || null,
        orgAccountId: metadata.orgAccountId || null,
        orgUuid: metadata.orgUuid || null,
        purchaseType: metadata.purchaseType || null,
        organizationName: metadata.organizationName || null,
        contactEmail: metadata.contactEmail || null,
        subscriptionRegion: metadata.subscriptionRegion || null,
        subscriptionPriceCents: metadata.subscriptionPriceCents || null,
      },
    });
  } catch (error: any) {
    console.error('Stripe session error:', error);

    return res.status(500).json({
      message: 'Failed to retrieve session',
      error: error.message,
    });
  }
};

export const createOrgSubscriptionCheckoutSession = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      orgAccountId,
      orgUuid,
      organizationName,
      contactEmail,
      subscriptionRegion,
    } = req.body ?? {};

    console.log('ORG SUB CHECKOUT BODY:', req.body);
    console.log('SUBSCRIPTION REGION RECEIVED:', subscriptionRegion);

    if (!orgAccountId || !orgUuid || !organizationName || !contactEmail) {
      return res.status(400).json({
        success: false,
        message:
          'orgAccountId, orgUuid, organizationName, and contactEmail are required',
      });
    }

    const normalizedRegion = String(subscriptionRegion || 'usa').toLowerCase();
    const regionPricing =
      ORG_SUBSCRIPTION_PRICES[normalizedRegion] || ORG_SUBSCRIPTION_PRICES.usa;

    const orgResult = await db.query(
      `
      SELECT
        id,
        org_uuid,
        organization_name,
        contact_email,
        status,
        verification_status
      FROM organization_accounts
      WHERE id = $1
        AND org_uuid = $2
      LIMIT 1
      `,
      [orgAccountId, orgUuid]
    );

    const org = orgResult.rows?.[0];

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization account not found',
      });
    }

    await db.query(
      `
      UPDATE organization_accounts
      SET
        subscription_region = $2,
        subscription_price_cents = $3,
        subscription_currency = $4,
        subscription_status = COALESCE(subscription_status, 'pending'),
        updated_at = NOW()
      WHERE id = $1
      `,
      [
        org.id,
        normalizedRegion,
        regionPricing.priceCents,
        regionPricing.currency,
      ]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: contactEmail,
      line_items: [
        {
          price_data: {
            currency: regionPricing.currency,
            product_data: {
              name: 'Organization Annual Subscription',
              description: `${regionPricing.label} annual subscription for ${organizationName}`,
            },
            unit_amount: regionPricing.priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/organization-registration-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/register-organization`,
      metadata: {
        purchaseType: 'org_subscription',
        type: 'org_subscription',
        orgAccountId: String(org.id),
        orgUuid: String(org.org_uuid),
        organizationName: String(org.organization_name),
        contactEmail: String(contactEmail),
        subscriptionRegion: normalizedRegion,
        subscriptionRegionLabel: regionPricing.label,
        subscriptionPriceCents: String(regionPricing.priceCents),
        currency: regionPricing.currency,
      },
    });

    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
      region: normalizedRegion,
      amountCents: regionPricing.priceCents,
    });
  } catch (error: any) {
    console.error('createOrgSubscriptionCheckoutSession error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create organization subscription checkout session',
      error: error.message,
    });
  }
};
export const createMajorEventRenewalCheckoutSession = async (
  req: Request,
  res: Response
) => {
  try {
    const { event_id, duration_days = 21, source } = req.body ?? {};

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "event_id is required",
      });
    }

    const eventResult = await db.query(
      `
      SELECT id, title, submitter_email
      FROM event_submissions
      WHERE id = $1
      LIMIT 1
      `,
      [event_id]
    );

    const event = eventResult.rows?.[0];

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: event.submitter_email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Major Event Renewal",
              description: `Extend Major Event placement for ${duration_days} days`,
            },
            unit_amount: 24900,
          },
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/campaign-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/account/my-events`,
      metadata: {
        purchaseType: "major_event_renewal",
        purchase_type: "major_event_renewal",
        eventId: String(event.id),
        event_id: String(event.id),
        duration_days: String(duration_days),
        source: String(source || "major-event-renewal"),
      },
    });

    return res.status(200).json({
      success: true,
      checkout_url: session.url,
      checkoutUrl: session.url,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("createMajorEventRenewalCheckoutSession error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create Major Event renewal checkout session",
      error: error.message,
    });
  }
};