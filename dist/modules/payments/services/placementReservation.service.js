"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHoldSessionToReservations = convertHoldSessionToReservations;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../../config/db");
function generateReservationCode() {
    const token = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
    return `PR-${Date.now()}-${token}`;
}
function todayUtcDateString() {
    return new Date().toISOString().slice(0, 10);
}
function resolvePublicationStatus(windowStartDate, windowEndDate) {
    const today = todayUtcDateString();
    if (today < windowStartDate)
        return 'scheduled';
    if (today > windowEndDate)
        return 'completed';
    return 'active';
}
function normalizeCurrency(value) {
    return (value || 'usd').toLowerCase();
}
async function getHoldSession(client, params) {
    if (!params.holdSessionId && !params.checkoutSessionId) {
        throw new Error('convertHoldSessionToReservations requires holdSessionId or checkoutSessionId');
    }
    let query = '';
    let values = [];
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
    }
    else {
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
        values = [params.checkoutSessionId];
    }
    const result = await client.query(query, values);
    if (result.rowCount === 0) {
        throw new Error('Placement hold session not found');
    }
    return result.rows[0];
}
async function getActiveHoldItems(client, holdSessionId) {
    const result = await client.query(`
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
    `, [holdSessionId]);
    return result.rows;
}
async function getProductContext(client, placementProductId) {
    const result = await client.query(`
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
    `, [placementProductId]);
    if (result.rowCount === 0) {
        throw new Error(`Placement product not found for id ${placementProductId}`);
    }
    return result.rows[0];
}
async function getEventContext(client, eventId) {
    if (!eventId)
        return null;
    // Adjust these joins/column names if your schema differs.
    const result = await client.query(`
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
    `, [eventId]);
    if (result.rowCount === 0)
        return null;
    return result.rows[0];
}
function buildEventUrl(eventContext, eventId) {
    if (eventContext?.event_code) {
        return `/events/${eventContext.event_code}`;
    }
    if (eventId) {
        return `/events/${eventId}`;
    }
    return '/events';
}
async function getUsedSlots(client, placementProductId, windowStartDate, windowEndDate) {
    const result = await client.query(`
      SELECT slot_number
      FROM placement_reservations
      WHERE placement_product_id = $1
        AND window_start_date = $2
        AND window_end_date = $3
        AND slot_number IS NOT NULL
        AND reservation_status IN ('reserved', 'active')
      ORDER BY slot_number ASC;
    `, [placementProductId, windowStartDate, windowEndDate]);
    return result.rows.map((row) => row.slot_number);
}
function assignNextAvailableSlot(slotCount, usedSlots) {
    if (!slotCount || slotCount <= 0)
        return null;
    for (let slot = 1; slot <= slotCount; slot += 1) {
        if (!usedSlots.includes(slot)) {
            return slot;
        }
    }
    throw new Error('No placement slots available for the selected window');
}
async function createReservation(client, args) {
    const reservationCode = generateReservationCode();
    const result = await client.query(`
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
    `, [
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
    ]);
    return result.rows[0];
}
async function createPublication(client, args) {
    const publicationStatus = resolvePublicationStatus(args.holdItem.window_start_date, args.holdItem.window_end_date);
    const displayTitle = args.eventContext?.title?.trim() ||
        args.productContext.product_name ||
        'Sponsored Event';
    const displaySubtitle = args.eventContext?.sponsor_name?.trim() || 'Sponsored Event';
    const displayImageUrl = args.eventContext?.image_url || null;
    const displayCtaLabel = 'View Event';
    const displayCtaUrl = buildEventUrl(args.eventContext, args.holdSession.event_id);
    const result = await client.query(`
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
    `, [
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
    ]);
    return result.rows[0];
}
async function markHoldItemConverted(client, holdItemId) {
    await client.query(`
      UPDATE placement_hold_items
      SET status = 'converted',
          updated_at = NOW()
      WHERE id = $1;
    `, [holdItemId]);
}
async function markHoldSessionConverted(client, holdSessionId) {
    await client.query(`
      UPDATE placement_hold_sessions
      SET status = 'converted',
          updated_at = NOW()
      WHERE id = $1;
    `, [holdSessionId]);
}
function assertHoldSessionConvertible(holdSession) {
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
async function convertHoldSessionToReservations(params) {
    const client = await db_1.db.connect();
    try {
        await client.query('BEGIN');
        const holdSession = await getHoldSession(client, params);
        // Lock session row to reduce duplicate conversions if webhook retries.
        const lockResult = await client.query(`
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
      `, [holdSession.id]);
        const lockedSession = lockResult.rows[0];
        assertHoldSessionConvertible(lockedSession);
        const holdItems = await getActiveHoldItems(client, lockedSession.id);
        if (holdItems.length === 0) {
            throw new Error('No active placement hold items found for conversion');
        }
        const eventContext = await getEventContext(client, lockedSession.event_id);
        const reservationIds = [];
        const publicationIds = [];
        const reservationCodes = [];
        for (const holdItem of holdItems) {
            const productContext = await getProductContext(client, holdItem.placement_product_id);
            const usedSlots = await getUsedSlots(client, holdItem.placement_product_id, holdItem.window_start_date, holdItem.window_end_date);
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
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
}
exports.default = {
    convertHoldSessionToReservations,
};
