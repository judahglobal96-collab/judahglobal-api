"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlacementHoldSession = createPlacementHoldSession;
exports.getPlacementHoldSession = getPlacementHoldSession;
exports.releasePlacementHoldSession = releasePlacementHoldSession;
exports.expirePlacementHoldSession = expirePlacementHoldSession;
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../../../config/db");
function generateHoldToken() {
    return `HOLD-${crypto_1.default.randomBytes(4).toString("hex").toUpperCase()}`;
}
function normalizeDateOnly(value) {
    const trimmed = String(value || "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        throw new Error(`Invalid date format "${value}". Expected YYYY-MM-DD.`);
    }
    return trimmed;
}
function assertValidWindow(startDate, endDate) {
    if (endDate < startDate) {
        throw new Error("windowEndDate must be greater than or equal to windowStartDate.");
    }
}
async function getProductByCode(client, placementProductCode) {
    const result = await client.query(`
    SELECT
      pp.id AS product_id,
      pp.code AS product_code,
      pp.name AS product_name,
      ps.id AS surface_id,
      ps.code AS surface_code,
      pp.default_price_cents,
      pp.is_active,
      pir.inventory_mode,
      pir.slot_count,
      COALESCE(pir.hold_duration_minutes, 15) AS hold_duration_minutes
    FROM placement_products pp
    INNER JOIN placement_surfaces ps
      ON ps.id = pp.surface_id
    INNER JOIN placement_inventory_rules pir
      ON pir.placement_product_id = pp.id
    WHERE pp.code = $1
    LIMIT 1
    `, [placementProductCode]);
    if (result.rowCount === 0) {
        throw new Error(`Placement product "${placementProductCode}" not found.`);
    }
    const row = result.rows[0];
    if (!row.is_active) {
        throw new Error(`Placement product "${placementProductCode}" is not active.`);
    }
    return row;
}
async function countActiveHolds(client, placementProductId, windowStartDate, windowEndDate) {
    const result = await client.query(`
    SELECT COALESCE(SUM(phi.quantity), 0)::text AS count
    FROM placement_hold_items phi
    INNER JOIN placement_hold_sessions phs
      ON phs.id = phi.hold_session_id
    WHERE phi.placement_product_id = $1
      AND phi.status = 'active'
      AND phs.status = 'active'
      AND phs.expires_at > NOW()
      AND phi.window_start_date <= $3::date
      AND phi.window_end_date >= $2::date
    `, [placementProductId, windowStartDate, windowEndDate]);
    return Number(result.rows[0]?.count || 0);
}
async function countActiveReservations(client, placementProductId, windowStartDate, windowEndDate) {
    const result = await client.query(`
    SELECT COALESCE(SUM(quantity), 0)::text AS count
    FROM placement_reservations
    WHERE placement_product_id = $1
      AND reservation_status IN ('reserved', 'active')
      AND window_start_date <= $3::date
      AND window_end_date >= $2::date
    `, [placementProductId, windowStartDate, windowEndDate]);
    return Number(result.rows[0]?.count || 0);
}
async function assertAvailabilityForWindow(client, product, windowStartDate, windowEndDate, quantity) {
    if (product.inventory_mode !== "slot_based") {
        return;
    }
    const slotCount = product.slot_count ?? 0;
    if (slotCount <= 0) {
        throw new Error(`Placement product "${product.product_code}" has no slot capacity configured.`);
    }
    const activeHolds = await countActiveHolds(client, product.product_id, windowStartDate, windowEndDate);
    const activeReservations = await countActiveReservations(client, product.product_id, windowStartDate, windowEndDate);
    const available = slotCount - activeHolds - activeReservations;
    if (available < quantity) {
        throw new Error(`No availability remaining for ${product.product_code} on ${windowStartDate} to ${windowEndDate}.`);
    }
}
async function createHoldSession(client, params) {
    const result = await client.query(`
    INSERT INTO placement_hold_sessions (
      hold_token,
      user_id,
      org_id,
      event_id,
      status,
      expires_at,
      currency,
      total_amount_cents
    )
    VALUES (
      $1, $2, $3, $4, 'active', $5, $6, 0
    )
    RETURNING
      id,
      hold_token,
      user_id,
      org_id,
      event_id,
      status,
      expires_at::text,
      checkout_session_id,
      currency,
      total_amount_cents,
      created_at::text,
      updated_at::text
    `, [
        generateHoldToken(),
        params.userId || null,
        params.orgId || null,
        params.eventId || null,
        params.expiresAt.toISOString(),
        params.currency || "usd",
    ]);
    return result.rows[0];
}
async function createHoldItem(client, args) {
    const result = await client.query(`
    INSERT INTO placement_hold_items (
      hold_session_id,
      placement_product_id,
      window_start_date,
      window_end_date,
      quantity,
      held_price_cents,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'active')
    RETURNING
      id,
      hold_session_id,
      placement_product_id,
      window_start_date::text,
      window_end_date::text,
      quantity,
      held_price_cents,
      status,
      created_at::text,
      updated_at::text
    `, [
        args.holdSessionId,
        args.placementProductId,
        args.windowStartDate,
        args.windowEndDate,
        args.quantity,
        args.heldPriceCents,
    ]);
    return result.rows[0];
}
async function updateHoldSessionTotal(client, holdSessionId) {
    await client.query(`
    UPDATE placement_hold_sessions phs
    SET
      total_amount_cents = COALESCE(sub.total_amount_cents, 0),
      updated_at = NOW()
    FROM (
      SELECT
        hold_session_id,
        SUM(held_price_cents * quantity)::integer AS total_amount_cents
      FROM placement_hold_items
      WHERE hold_session_id = $1
        AND status = 'active'
      GROUP BY hold_session_id
    ) sub
    WHERE phs.id = $1
    `, [holdSessionId]);
}
async function getHoldSessionById(client, holdSessionId) {
    const result = await client.query(`
    SELECT
      id,
      hold_token,
      user_id,
      org_id,
      event_id,
      status,
      expires_at::text,
      checkout_session_id,
      currency,
      total_amount_cents,
      created_at::text,
      updated_at::text
    FROM placement_hold_sessions
    WHERE id = $1
    LIMIT 1
    `, [holdSessionId]);
    return result.rows[0] || null;
}
async function getHoldItemsDetailed(client, holdSessionId) {
    const result = await client.query(`
    SELECT
      phi.id AS hold_item_id,
      phi.placement_product_id,
      pp.code AS placement_product_code,
      pp.name AS placement_product_name,
      ps.id AS surface_id,
      ps.code AS surface_code,
      phi.window_start_date::text AS window_start_date,
      phi.window_end_date::text AS window_end_date,
      phi.quantity,
      phi.held_price_cents,
      phi.status
    FROM placement_hold_items phi
    INNER JOIN placement_products pp
      ON pp.id = phi.placement_product_id
    INNER JOIN placement_surfaces ps
      ON ps.id = pp.surface_id
    WHERE phi.hold_session_id = $1
    ORDER BY phi.window_start_date ASC, phi.created_at ASC
    `, [holdSessionId]);
    return result.rows;
}
function mapHoldResponse(holdSession, items) {
    return {
        holdSessionId: holdSession.id,
        holdToken: holdSession.hold_token,
        status: holdSession.status,
        expiresAt: holdSession.expires_at,
        currency: holdSession.currency,
        totalAmountCents: Number(holdSession.total_amount_cents || 0),
        items: items.map((item) => ({
            holdItemId: item.hold_item_id,
            placementProductId: item.placement_product_id,
            placementProductCode: item.placement_product_code,
            placementProductName: item.placement_product_name,
            surfaceId: item.surface_id,
            surfaceCode: item.surface_code,
            windowStartDate: item.window_start_date,
            windowEndDate: item.window_end_date,
            quantity: Number(item.quantity || 0),
            heldPriceCents: Number(item.held_price_cents || 0),
            status: item.status,
        })),
    };
}
async function createPlacementHoldSession(input) {
    if (!Array.isArray(input.windows) || input.windows.length === 0) {
        throw new Error("At least one placement window is required.");
    }
    const client = await db_1.db.connect();
    try {
        await client.query("BEGIN");
        const productsForWindows = [];
        let maxHoldMinutes = 15;
        for (const rawWindow of input.windows) {
            const quantity = Number(rawWindow.quantity || 1);
            if (!rawWindow.placementProductCode) {
                throw new Error("placementProductCode is required for each window.");
            }
            if (quantity <= 0) {
                throw new Error("quantity must be greater than 0.");
            }
            const startDate = normalizeDateOnly(rawWindow.windowStartDate);
            const endDate = normalizeDateOnly(rawWindow.windowEndDate);
            assertValidWindow(startDate, endDate);
            const product = await getProductByCode(client, rawWindow.placementProductCode);
            await assertAvailabilityForWindow(client, product, startDate, endDate, quantity);
            maxHoldMinutes = Math.max(maxHoldMinutes, product.hold_duration_minutes || 15);
            productsForWindows.push({
                window: rawWindow,
                product,
                quantity,
                startDate,
                endDate,
            });
        }
        const expiresAt = new Date(Date.now() + maxHoldMinutes * 60 * 1000);
        const holdSession = await createHoldSession(client, {
            userId: input.userId || null,
            orgId: input.orgId || null,
            eventId: input.eventId || null,
            expiresAt,
            currency: "usd",
        });
        for (const entry of productsForWindows) {
            await createHoldItem(client, {
                holdSessionId: holdSession.id,
                placementProductId: entry.product.product_id,
                windowStartDate: entry.startDate,
                windowEndDate: entry.endDate,
                quantity: entry.quantity,
                heldPriceCents: Number(entry.product.default_price_cents || 0),
            });
        }
        await updateHoldSessionTotal(client, holdSession.id);
        const refreshedSession = await getHoldSessionById(client, holdSession.id);
        const items = await getHoldItemsDetailed(client, holdSession.id);
        await client.query("COMMIT");
        if (!refreshedSession) {
            throw new Error("Failed to reload placement hold session after creation.");
        }
        return mapHoldResponse(refreshedSession, items);
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function getPlacementHoldSession(holdSessionId) {
    const client = await db_1.db.connect();
    try {
        const holdSession = await getHoldSessionById(client, holdSessionId);
        if (!holdSession) {
            throw new Error("Placement hold session not found.");
        }
        const items = await getHoldItemsDetailed(client, holdSessionId);
        return mapHoldResponse(holdSession, items);
    }
    finally {
        client.release();
    }
}
async function releasePlacementHoldSession(holdSessionId) {
    const client = await db_1.db.connect();
    try {
        await client.query("BEGIN");
        const holdSession = await getHoldSessionById(client, holdSessionId);
        if (!holdSession) {
            throw new Error("Placement hold session not found.");
        }
        if (holdSession.status === "converted") {
            throw new Error("Converted hold sessions cannot be released.");
        }
        await client.query(`
      UPDATE placement_hold_items
      SET
        status = 'released',
        updated_at = NOW()
      WHERE hold_session_id = $1
        AND status = 'active'
      `, [holdSessionId]);
        await client.query(`
      UPDATE placement_hold_sessions
      SET
        status = 'released',
        total_amount_cents = 0,
        updated_at = NOW()
      WHERE id = $1
      `, [holdSessionId]);
        const refreshedSession = await getHoldSessionById(client, holdSessionId);
        const items = await getHoldItemsDetailed(client, holdSessionId);
        await client.query("COMMIT");
        if (!refreshedSession) {
            throw new Error("Failed to reload placement hold session after release.");
        }
        return mapHoldResponse(refreshedSession, items);
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
async function expirePlacementHoldSession(holdSessionId) {
    const client = await db_1.db.connect();
    try {
        await client.query("BEGIN");
        await client.query(`
      UPDATE placement_hold_items
      SET
        status = 'expired',
        updated_at = NOW()
      WHERE hold_session_id = $1
        AND status = 'active'
      `, [holdSessionId]);
        await client.query(`
      UPDATE placement_hold_sessions
      SET
        status = 'expired',
        total_amount_cents = 0,
        updated_at = NOW()
      WHERE id = $1
        AND status = 'active'
      `, [holdSessionId]);
        await client.query("COMMIT");
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
