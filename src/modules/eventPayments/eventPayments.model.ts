import {db} from '../../config/db';

export type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'waived';

export interface EventPaymentRow {
  id: string;
  event_id: string;
  payment_status: PaymentStatus;
  payment_provider: string;
  amount_cents: number;
  currency: string;
  checkout_session_id: string | null;
  payment_intent_id: string | null;
  customer_email: string | null;
  paid_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function findEventSubmissionForPayment(eventId: string) {
  const query = `
  SELECT
    es.id,
    es.owner_user_id,
    es.status,
    es.payment_status,
    es.payment_amount_cents,
    es.payment_currency,
    es.title,
    sp.contact_email
  FROM event_submissions es
  LEFT JOIN event_sponsors sp
    ON sp.event_id = es.id
  WHERE es.id = $1
  LIMIT 1
`;

  const result = await db.query(query, [eventId]);
  return result.rows[0] || null;
}

export async function createPendingPayment(params: {
  eventId: string;
  amountCents: number;
  currency: string;
  checkoutSessionId: string;
  customerEmail?: string | null;
  paymentProvider?: string;
}) {
  const {
    eventId,
    amountCents,
    currency,
    checkoutSessionId,
    customerEmail = null,
    paymentProvider = 'stripe',
  } = params;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const insertPaymentQuery = `
      INSERT INTO event_payments (
        event_id,
        payment_status,
        payment_provider,
        amount_cents,
        currency,
        checkout_session_id,
        customer_email
      )
      VALUES ($1, 'pending', $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const paymentResult = await client.query(insertPaymentQuery, [
      eventId,
      paymentProvider,
      amountCents,
      currency,
      checkoutSessionId,
      customerEmail,
    ]);

    const updateEventQuery = `
      UPDATE event_submissions
      SET
        payment_status = 'pending',
        payment_amount_cents = $2,
        payment_currency = $3,
        payment_reference = $4,
        payment_provider = $5,
        payment_updated_at = NOW()
      WHERE id = $1
      RETURNING id, payment_status, payment_reference
    `;

    await client.query(updateEventQuery, [
      eventId,
      amountCents,
      currency,
      checkoutSessionId,
      paymentProvider,
    ]);

    await client.query('COMMIT');
    return paymentResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function markPaymentPaid(params: {
  checkoutSessionId: string;
  paymentIntentId?: string | null;
  customerEmail?: string | null;
}) {
  const {
    checkoutSessionId,
    paymentIntentId = null,
    customerEmail = null,
  } = params;

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const paymentLookup = await client.query(
      `
      SELECT id, event_id, payment_status
      FROM event_payments
      WHERE checkout_session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [checkoutSessionId]
    );

    const payment = paymentLookup.rows[0];
    if (!payment) {
      throw new Error('Payment record not found for checkout session.');
    }

    await client.query(
      `
      UPDATE event_payments
      SET
        payment_status = 'paid',
        payment_intent_id = COALESCE($2, payment_intent_id),
        customer_email = COALESCE($3, customer_email),
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [payment.id, paymentIntentId, customerEmail]
    );

    await client.query(
      `
      UPDATE event_submissions
      SET
        payment_status = 'paid',
        payment_reference = $2,
        payment_paid_at = NOW(),
        payment_updated_at = NOW(),
        status = CASE
          WHEN status = 'draft' THEN 'pending'
          ELSE status
        END
      WHERE id = $1
      `,
      [payment.event_id, checkoutSessionId]
    );

    await client.query('COMMIT');
    return { eventId: payment.event_id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function markPaymentFailed(checkoutSessionId: string) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const paymentLookup = await client.query(
      `
      SELECT id, event_id
      FROM event_payments
      WHERE checkout_session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [checkoutSessionId]
    );

    const payment = paymentLookup.rows[0];
    if (!payment) {
      throw new Error('Payment record not found for checkout session.');
    }

    await client.query(
      `
      UPDATE event_payments
      SET
        payment_status = 'failed',
        failed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      `,
      [payment.id]
    );

    await client.query(
      `
      UPDATE event_submissions
      SET
        payment_status = 'failed',
        payment_failed_at = NOW(),
        payment_updated_at = NOW()
      WHERE id = $1
      `,
      [payment.event_id]
    );

    await client.query('COMMIT');
    return { eventId: payment.event_id };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}