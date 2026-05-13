import crypto from 'crypto';
import { PoolClient } from 'pg';
import {db} from '../../../config/db';

type NullableString = string | null | undefined;

export interface ConvertHoldSessionParams {
  holdSessionId?: string;
  checkoutSessionId?: string;
  stripePaymentIntentId?: string | null;
}

export interface ConvertHoldSessionResult {
  holdSessionId: string;
  reservationIds: string[];
  publicationIds: string[];
  reservationCodes: string[];
}

interface HoldSessionRow {
  id: string;
  hold_token: string;
  user_id: string | null;
  org_id: string | null;
  event_id: string | null;
  status: 'active' | 'expired' | 'converted' | 'cancelled' | 'released';
  expires_at: string;
  checkout_session_id: string | null;
  currency: string;
  total_amount_cents: number;
  created_at: string;
  updated_at: string;
}

interface HoldItemRow {
  id: string;
  hold_session_id: string;
  placement_product_id: string;
  window_start_date: string;
  window_end_date: string;
  quantity: number;
  held_price_cents: number;
  status: 'active' | 'expired' | 'converted' | 'cancelled' | 'released';
  created_at: string;
  updated_at: string;
}

interface ProductContextRow {
  product_id: string;
  product_code: string;
  product_name: string;
  surface_id: string;
  surface_code: string;
  surface_name: string;
  slot_count: number | null;
}

interface EventContextRow {
  event_id: string;
  title: string | null;
  sponsor_name: string | null;
  image_url: string | null;
  event_code: string | null;
}

interface ReservationInsertRow {
  id: string;
  reservation_code: string;
  slot_number: number | null;
}

interface PublicationInsertRow {
  id: string;
}

function generateReservationCode(): string {
  const token = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PR-${Date.now()}-${token}`;
}

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function resolvePublicationStatus(
  windowStartDate: string,
  windowEndDate: string,
): 'scheduled' | 'active' | 'completed' {
  const today = todayUtcDateString();

  if (today < windowStartDate) return 'scheduled';
  if (today > windowEndDate) return 'completed';
  return 'active';
}

function normalizeCurrency(value: NullableString): string {
  return (value || 'usd').toLowerCase();
}

async function getHoldSession(
  client: PoolClient,
  params: ConvertHoldSessionParams,
): Promise<HoldSessionRow> {
  if (!params.holdSessionId && !params.checkoutSessionId) {
    throw new Error('convertHoldSessionToReservations requires holdSessionId or checkoutSessionId');
  }

  let query = '';
  let values: string[] = [];

  if (params.holdSessionId) {
    query = `
      SELECT
        id,
        hold_token,
        user_id,
        org_id,
        event_id,
        status,
        expires_at,
        checkout_session_id,
        currency,
        total_amount_cents,
        created_at,
        updated_at
      FROM placement_hold_sessions
      WHERE id = $1
      LIMIT 1;
    `;
    values = [params.holdSessionId];
  } else {
    query = `
      SELECT
        id,
        hold_token,
        user_id,
        org_id,
        event_id,
        status,
        expires_at,
        checkout_session_id,
        currency,
        total_amount_cents,
        created_at,
        updated_at
      FROM placement_hold_sessions
      WHERE checkout_session_id = $1
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    values = [params.checkoutSessionId as string];
  }

  const result = await client.query<HoldSessionRow>(query, values);

  if (result.rowCount === 0) {
    throw new Error('Placement hold session not found');
  }

  return result.rows[0];
}

async function getActiveHoldItems(
  client: PoolClient,
  holdSessionId: string,
): Promise<HoldItemRow[]> {
  const result = await client.query<HoldItemRow>(
    `
      SELECT
        id,
        hold_session_id,
        placement_product_id,
        window_start_date::text,
        window_end_date::text,
        quantity,
        held_price_cents,
        status,
        created_at,
        updated_at
      FROM placement_hold_items
      WHERE hold_session_id = $1
        AND status = 'active'
      ORDER BY window_start_date ASC, created_at ASC;
    `,
    [holdSessionId],
  );

  return result.rows;
}

async function getProductContext(
  client: PoolClient,
  placementProductId: string,
): Promise<ProductContextRow> {
  const result = await client.query<ProductContextRow>(
    `
      SELECT
        pp.id AS product_id,
        pp.code AS product_code,
        pp.name AS product_name,
        ps.id AS surface_id,
        ps.code AS surface_code,
        ps.name AS surface_name,
        pir.slot_count
      FROM placement_products pp
      INNER JOIN placement_surfaces ps
        ON ps.id = pp.surface_id
      LEFT JOIN placement_inventory_rules pir
        ON pir.placement_product_id = pp.id
      WHERE pp.id = $1
      LIMIT 1;
    `,
    [placementProductId],
  );

  if (result.rowCount === 0) {
    throw new Error(`Placement product not found for id ${placementProductId}`);
  }

  return result.rows[0];
}

async function getEventContext(
  client: PoolClient,
  eventId: string | null,
): Promise<EventContextRow | null> {
  if (!eventId) return null;

  // Adjust these joins/column names if your schema differs.
  const result = await client.query<EventContextRow>(
    `
      SELECT
        es.event_id,
        es.title,
        s.sponsor_name,
        COALESCE(
          (
            SELECT em.file_url
            FROM event_media em
            WHERE em.event_id = es.event_id
              AND em.moderation_status = 'approved'
            ORDER BY COALESCE(em.is_primary, false) DESC, em.created_at ASC
            LIMIT 1
          ),
          s.logo_url
        ) AS image_url,
        es.event_code
      FROM event_submissions es
      LEFT JOIN event_sponsors s
        ON s.event_id = es.event_id
      WHERE es.event_id = $1
      LIMIT 1;
    `,
    [eventId],
  );

  if (result.rowCount === 0) return null;
  return result.rows[0];
}

function buildEventUrl(eventContext: EventContextRow | null, eventId: string | null): string {
  if (eventContext?.event_code) {
    return `/events/${eventContext.event_code}`;
  }

  if (eventId) {
    return `/events/${eventId}`;
  }

  return '/events';
}

async function getUsedSlots(
  client: PoolClient,
  placementProductId: string,
  windowStartDate: string,
  windowEndDate: string,
): Promise<number[]> {
  const result = await client.query<{ slot_number: number }>(
    `
      SELECT slot_number
      FROM placement_reservations
      WHERE placement_product_id = $1
        AND window_start_date = $2
        AND window_end_date = $3
        AND slot_number IS NOT NULL
        AND reservation_status IN ('reserved', 'active')
      ORDER BY slot_number ASC;
    `,
    [placementProductId, windowStartDate, windowEndDate],
  );

  return result.rows.map((row) => row.slot_number);
}

function assignNextAvailableSlot(slotCount: number | null, usedSlots: number[]): number | null {
  if (!slotCount || slotCount <= 0) return null;

  for (let slot = 1; slot <= slotCount; slot += 1) {
    if (!usedSlots.includes(slot)) {
      return slot;
    }
  }

  throw new Error('No placement slots available for the selected window');
}

async function createReservation(
  client: PoolClient,
  args: {
    holdSession: HoldSessionRow;
    holdItem: HoldItemRow;
    productContext: ProductContextRow;
    slotNumber: number | null;
    stripePaymentIntentId?: string | null;
  },
): Promise<ReservationInsertRow> {
  const reservationCode = generateReservationCode();

  const result = await client.query<ReservationInsertRow>(
    `
      INSERT INTO placement_reservations (
        reservation_code,
        hold_session_id,
        hold_item_id,
        user_id,
        org_id,
        event_id,
        placement_product_id,
        window_start_date,
        window_end_date,
        slot_number,
        quantity,
        price_cents,
        currency,
        payment_status,
        reservation_status,
        stripe_checkout_session_id,
        stripe_payment_intent_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        'paid', 'reserved', $14, $15
      )
      RETURNING id, reservation_code, slot_number;
    `,
    [
      reservationCode,
      args.holdSession.id,
      args.holdItem.id,
      args.holdSession.user_id,
      args.holdSession.org_id,
      args.holdSession.event_id,
      args.holdItem.placement_product_id,
      args.holdItem.window_start_date,
      args.holdItem.window_end_date,
      args.slotNumber,
      args.holdItem.quantity,
      args.holdItem.held_price_cents,
      normalizeCurrency(args.holdSession.currency),
      args.holdSession.checkout_session_id,
      args.stripePaymentIntentId || null,
    ],
  );

  return result.rows[0];
}

async function createPublication(
  client: PoolClient,
  args: {
    reservation: ReservationInsertRow;
    holdSession: HoldSessionRow;
    holdItem: HoldItemRow;
    productContext: ProductContextRow;
    eventContext: EventContextRow | null;
  },
): Promise<PublicationInsertRow> {
  const publicationStatus = resolvePublicationStatus(
    args.holdItem.window_start_date,
    args.holdItem.window_end_date,
  );

  const displayTitle =
    args.eventContext?.title?.trim() ||
    args.productContext.product_name ||
    'Sponsored Event';

  const displaySubtitle =
    args.eventContext?.sponsor_name?.trim() || 'Sponsored Event';

  const displayImageUrl = args.eventContext?.image_url || null;
  const displayCtaLabel = 'View Event';
  const displayCtaUrl = buildEventUrl(args.eventContext, args.holdSession.event_id);

  const result = await client.query<PublicationInsertRow>(
    `
      INSERT INTO placement_publications (
        reservation_id,
        event_id,
        placement_product_id,
        surface_id,
        placement_code,
        display_title,
        display_subtitle,
        display_image_url,
        display_cta_label,
        display_cta_url,
        window_start_date,
        window_end_date,
        publication_status,
        approval_status,
        slot_number,
        priority_score,
        source_event_title,
        source_sponsor_name
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, 'approved', $14, $15, $16, $17
      )
      RETURNING id;
    `,
    [
      args.reservation.id,
      args.holdSession.event_id,
      args.holdItem.placement_product_id,
      args.productContext.surface_id,
      args.productContext.product_code,
      displayTitle,
      displaySubtitle,
      displayImageUrl,
      displayCtaLabel,
      displayCtaUrl,
      args.holdItem.window_start_date,
      args.holdItem.window_end_date,
      publicationStatus,
      args.reservation.slot_number,
      0,
      args.eventContext?.title || null,
      args.eventContext?.sponsor_name || null,
    ],
  );

  return result.rows[0];
}

async function markHoldItemConverted(
  client: PoolClient,
  holdItemId: string,
): Promise<void> {
  await client.query(
    `
      UPDATE placement_hold_items
      SET status = 'converted',
          updated_at = NOW()
      WHERE id = $1;
    `,
    [holdItemId],
  );
}

async function markHoldSessionConverted(
  client: PoolClient,
  holdSessionId: string,
): Promise<void> {
  await client.query(
    `
      UPDATE placement_hold_sessions
      SET status = 'converted',
          updated_at = NOW()
      WHERE id = $1;
    `,
    [holdSessionId],
  );
}

function assertHoldSessionConvertible(holdSession: HoldSessionRow): void {
  if (holdSession.status === 'converted') {
    throw new Error('Placement hold session has already been converted');
  }

  if (holdSession.status !== 'active') {
    throw new Error(`Placement hold session is not convertible from status "${holdSession.status}"`);
  }

  const now = new Date();
  const expiresAt = new Date(holdSession.expires_at);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error('Placement hold session has invalid expires_at');
  }

  if (expiresAt < now) {
    throw new Error('Placement hold session has expired');
  }
}

export async function convertHoldSessionToReservations(
  params: ConvertHoldSessionParams,
): Promise<ConvertHoldSessionResult> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const holdSession = await getHoldSession(client, params);

    // Lock session row to reduce duplicate conversions if webhook retries.
    const lockResult = await client.query<HoldSessionRow>(
      `
        SELECT
          id,
          hold_token,
          user_id,
          org_id,
          event_id,
          status,
          expires_at,
          checkout_session_id,
          currency,
          total_amount_cents,
          created_at,
          updated_at
        FROM placement_hold_sessions
        WHERE id = $1
        FOR UPDATE;
      `,
      [holdSession.id],
    );

    const lockedSession = lockResult.rows[0];
    assertHoldSessionConvertible(lockedSession);

    const holdItems = await getActiveHoldItems(client, lockedSession.id);

    if (holdItems.length === 0) {
      throw new Error('No active placement hold items found for conversion');
    }

    const eventContext = await getEventContext(client, lockedSession.event_id);

    const reservationIds: string[] = [];
    const publicationIds: string[] = [];
    const reservationCodes: string[] = [];

    for (const holdItem of holdItems) {
      const productContext = await getProductContext(client, holdItem.placement_product_id);

      const usedSlots = await getUsedSlots(
        client,
        holdItem.placement_product_id,
        holdItem.window_start_date,
        holdItem.window_end_date,
      );

      const slotNumber = assignNextAvailableSlot(productContext.slot_count, usedSlots);

      const reservation = await createReservation(client, {
        holdSession: lockedSession,
        holdItem,
        productContext,
        slotNumber,
        stripePaymentIntentId: params.stripePaymentIntentId || null,
      });

      const publication = await createPublication(client, {
        reservation,
        holdSession: lockedSession,
        holdItem,
        productContext,
        eventContext,
      });

      await markHoldItemConverted(client, holdItem.id);

      reservationIds.push(reservation.id);
      publicationIds.push(publication.id);
      reservationCodes.push(reservation.reservation_code);
    }

    await markHoldSessionConverted(client, lockedSession.id);

    await client.query('COMMIT');

    return {
      holdSessionId: lockedSession.id,
      reservationIds,
      publicationIds,
      reservationCodes,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default {
  convertHoldSessionToReservations,
};