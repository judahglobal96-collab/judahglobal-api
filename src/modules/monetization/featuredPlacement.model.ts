// LEGACY FEATURED PLACEMENT MODULE
// Retained temporarily for backward compatibility.
// New monetization flow should use campaign.* modules.

import { db } from "../../config/db";

export type AvailablePlacementRow = {
  id: string;
  placement_key: string;
  placement_name: string;
  page_name: string;
  slot_position: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  placement_type: string | null;
  starts_at_utc: string | null;
  ends_at_utc: string | null;
  duration_days: number | null;
};

export type ReservePlacementParams = {
  eventId: string;
  inventoryId: string;
};

export type PromoType =
  | "hero"
  | "homepage"
  | "discovery"
  | "featured_badge"
  | "major_events";

export type DurationDays = 7 | 10;

export type CampaignAvailabilityParams = {
  promoType: PromoType;
  startDate: string;
  durationDays: DurationDays;
};

export type CampaignReservationParams = {
  eventId: string;
  promoType: PromoType;
  startDate: string;
  durationDays: DurationDays;
};

type InventoryFilter =
  | {
      pageName: string;
      placementType: string;
    }
  | null;

function mapPromoTypeToInventoryFilter(promoType: PromoType): InventoryFilter {
  switch (promoType) {
    case "homepage":
      return {
        pageName: "homepage",
        placementType: "homepage_top",
      };

    case "discovery":
      return {
        pageName: "discovery",
        placementType: "discovery_top",
      };

    case "hero":
      return {
        pageName: "homepage",
        placementType: "hero",
      };

    case "featured_badge":
    case "major_events":
      return null;

    default:
      return {
        pageName: "homepage",
        placementType: "homepage_top",
      };
  }
}

function buildUtcWindow(startDate: string, durationDays: DurationDays) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + durationDays);

  return {
    startsAtUtc: start.toISOString(),
    endsAtUtc: end.toISOString(),
  };
}

export async function getAvailableFeaturedPlacements(pageName?: string) {
  const values: any[] = [];
  let pageFilterSql = "";

  if (pageName) {
    values.push(pageName);
    pageFilterSql = `AND fpi.page_name = $${values.length}`;
  }

  const query = `
    SELECT
      fpi.id,
      fpi.placement_key,
      fpi.placement_name,
      fpi.page_name,
      fpi.slot_position,
      fpi.price_cents,
      fpi.currency,
      fpi.is_active,
      fpi.placement_type,
      fpi.starts_at_utc,
      fpi.ends_at_utc,
      fpi.duration_days
    FROM featured_placement_inventory fpi
    WHERE fpi.is_active = TRUE
      ${pageFilterSql}
      AND NOT EXISTS (
        SELECT 1
        FROM event_featured_placements efp
        WHERE efp.inventory_id = fpi.id
          AND efp.placement_status IN ('reserved', 'active')
      )
    ORDER BY
      fpi.page_name ASC,
      fpi.placement_type ASC NULLS LAST,
      fpi.starts_at_utc ASC NULLS LAST,
      fpi.slot_position ASC
  `;

  const result = await db.query<AvailablePlacementRow>(query, values);
  return result.rows;
}

export async function getFeaturedPlacementInventoryById(inventoryId: string) {
  const result = await db.query<AvailablePlacementRow>(
    `
    SELECT
      id,
      placement_key,
      placement_name,
      page_name,
      slot_position,
      price_cents,
      currency,
      is_active,
      placement_type,
      starts_at_utc,
      ends_at_utc,
      duration_days
    FROM featured_placement_inventory
    WHERE id = $1
    LIMIT 1
    `,
    [inventoryId]
  );

  return result.rows[0] ?? null;
}

export async function getFeaturedPlacementInventoryByIds(inventoryIds: string[]) {
  if (inventoryIds.length === 0) return [];

  const result = await db.query<AvailablePlacementRow>(
    `
    SELECT
      id,
      placement_key,
      placement_name,
      page_name,
      slot_position,
      price_cents,
      currency,
      is_active,
      placement_type,
      starts_at_utc,
      ends_at_utc,
      duration_days
    FROM featured_placement_inventory
    WHERE id = ANY($1::uuid[])
    ORDER BY starts_at_utc ASC NULLS LAST, slot_position ASC
    `,
    [inventoryIds]
  );

  return result.rows;
}

export async function isPlacementInventoryAvailable(inventoryId: string) {
  const result = await db.query(
    `
    SELECT fpi.id
    FROM featured_placement_inventory fpi
    WHERE fpi.id = $1
      AND fpi.is_active = TRUE
      AND NOT EXISTS (
        SELECT 1
        FROM event_featured_placements efp
        WHERE efp.inventory_id = fpi.id
          AND efp.placement_status IN ('reserved', 'active')
      )
    LIMIT 1
    `,
    [inventoryId]
  );

  return (result.rowCount ?? 0) > 0;
}

export async function getExistingPlacementReservationForEvent(eventId: string) {
  const result = await db.query(
    `
    SELECT
      efp.id,
      efp.event_id,
      efp.inventory_id,
      efp.placement_status,
      efp.reserved_at,
      fpi.placement_key,
      fpi.placement_name,
      fpi.page_name,
      fpi.slot_position,
      fpi.price_cents,
      fpi.currency,
      fpi.placement_type,
      fpi.starts_at_utc,
      fpi.ends_at_utc,
      fpi.duration_days
    FROM event_featured_placements efp
    INNER JOIN featured_placement_inventory fpi
      ON fpi.id = efp.inventory_id
    WHERE efp.event_id = $1
      AND efp.placement_status IN ('reserved', 'active')
    ORDER BY fpi.starts_at_utc ASC NULLS LAST, efp.created_at DESC
    `,
    [eventId]
  );

  return result.rows;
}

export async function reserveFeaturedPlacement({
  eventId,
  inventoryId,
}: ReservePlacementParams) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const inventoryResult = await client.query(
      `
      SELECT
        id,
        placement_key,
        placement_name,
        page_name,
        slot_position,
        price_cents,
        currency,
        is_active,
        placement_type,
        starts_at_utc,
        ends_at_utc,
        duration_days
      FROM featured_placement_inventory
      WHERE id = $1
      FOR UPDATE
      `,
      [inventoryId]
    );

    if (inventoryResult.rowCount === 0) {
      throw new Error("Featured placement slot not found.");
    }

    const inventory = inventoryResult.rows[0];

    if (!inventory.is_active) {
      throw new Error("Featured placement slot is not active.");
    }

    const alreadyTakenResult = await client.query(
      `
      SELECT id
      FROM event_featured_placements
      WHERE inventory_id = $1
        AND placement_status IN ('reserved', 'active')
      LIMIT 1
      FOR UPDATE
      `,
      [inventoryId]
    );

    if ((alreadyTakenResult.rowCount ?? 0) > 0) {
      throw new Error("Featured placement slot is no longer available.");
    }

    const existingSameReservationResult = await client.query(
      `
      SELECT id
      FROM event_featured_placements
      WHERE event_id = $1
        AND inventory_id = $2
        AND placement_status IN ('reserved', 'active')
      LIMIT 1
      `,
      [eventId, inventoryId]
    );

    if ((existingSameReservationResult.rowCount ?? 0) > 0) {
      await client.query("COMMIT");
      return {
        alreadyReserved: true,
        reservationId: existingSameReservationResult.rows[0].id,
        inventory,
      };
    }

    const reservationResult = await client.query(
      `
      INSERT INTO event_featured_placements (
        event_id,
        inventory_id,
        placement_status,
        reserved_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'reserved', NOW(), NOW(), NOW())
      RETURNING id, event_id, inventory_id, placement_status, reserved_at
      `,
      [eventId, inventoryId]
    );

    await client.query(
      `
      UPDATE event_submissions
      SET
        has_featured_placement = TRUE,
        featured_placement_inventory_id = $2,
        featured_placement_status = 'reserved',
        updated_at = NOW()
      WHERE id = $1
      `,
      [eventId, inventoryId]
    );

    await client.query("COMMIT");

    return {
      alreadyReserved: false,
      reservationId: reservationResult.rows[0].id,
      inventory,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getCampaignAvailability({
  promoType,
  startDate,
  durationDays,
}: CampaignAvailabilityParams) {
  const filter = mapPromoTypeToInventoryFilter(promoType);
  const { startsAtUtc, endsAtUtc } = buildUtcWindow(startDate, durationDays);

  if (!filter) {
    return {
      available: true,
      count: 1,
      placements: [],
      startsAtUtc,
      endsAtUtc,
      pageName: null,
      placementType: promoType,
      nonInventory: true,
    };
  }

  const { pageName, placementType } = filter;

  const result = await db.query<AvailablePlacementRow>(
    `
    SELECT
      fpi.id,
      fpi.placement_key,
      fpi.placement_name,
      fpi.page_name,
      fpi.slot_position,
      fpi.price_cents,
      fpi.currency,
      fpi.is_active,
      fpi.placement_type,
      fpi.starts_at_utc,
      fpi.ends_at_utc,
      fpi.duration_days
    FROM featured_placement_inventory fpi
    WHERE fpi.is_active = TRUE
      AND fpi.page_name = $1
      AND COALESCE(fpi.placement_type, '') = $2
      AND (
        fpi.starts_at_utc IS NULL
        OR fpi.starts_at_utc <= $3::timestamptz
      )
      AND (
        fpi.ends_at_utc IS NULL
        OR fpi.ends_at_utc >= $4::timestamptz
      )
      AND NOT EXISTS (
        SELECT 1
        FROM event_featured_placements efp
        WHERE efp.inventory_id = fpi.id
          AND efp.placement_status IN ('reserved', 'active')
      )
    ORDER BY fpi.slot_position ASC
    `,
    [pageName, placementType, startsAtUtc, endsAtUtc]
  );

  return {
    available: result.rows.length > 0,
    count: result.rows.length,
    placements: result.rows,
    startsAtUtc,
    endsAtUtc,
    pageName,
    placementType,
    nonInventory: false,
  };
}

export async function autoAssignAndReserveCampaign({
  eventId,
  promoType,
  startDate,
  durationDays,
}: CampaignReservationParams) {
  const filter = mapPromoTypeToInventoryFilter(promoType);

  if (!filter) {
    await db.query(
      `
      UPDATE event_submissions
      SET
        has_featured_placement = TRUE,
        featured_placement_inventory_id = NULL,
        featured_placement_status = 'reserved',
        updated_at = NOW()
      WHERE id = $1
      `,
      [eventId]
    );

    return {
      alreadyReserved: false,
      inventory: null,
      reservationId: null,
      nonInventory: true,
      placementType: promoType,
    };
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const { pageName, placementType } = filter;
    const { startsAtUtc, endsAtUtc } = buildUtcWindow(startDate, durationDays);

    const inventoryResult = await client.query<AvailablePlacementRow>(
      `
      SELECT
        fpi.id,
        fpi.placement_key,
        fpi.placement_name,
        fpi.page_name,
        fpi.slot_position,
        fpi.price_cents,
        fpi.currency,
        fpi.is_active,
        fpi.placement_type,
        fpi.starts_at_utc,
        fpi.ends_at_utc,
        fpi.duration_days
      FROM featured_placement_inventory fpi
      WHERE fpi.is_active = TRUE
        AND fpi.page_name = $1
        AND COALESCE(fpi.placement_type, '') = $2
        AND (
          fpi.starts_at_utc IS NULL
          OR fpi.starts_at_utc <= $3::timestamptz
        )
        AND (
          fpi.ends_at_utc IS NULL
          OR fpi.ends_at_utc >= $4::timestamptz
        )        AND NOT EXISTS (
          SELECT 1
          FROM event_featured_placements efp
          WHERE efp.inventory_id = fpi.id
            AND efp.placement_status IN ('reserved', 'active')
        )
      ORDER BY fpi.slot_position ASC
      LIMIT 1
      FOR UPDATE
      `,
      [pageName, placementType, startsAtUtc, endsAtUtc]
    );

    if ((inventoryResult.rowCount ?? 0) === 0) {
      throw new Error("No placement inventory is available for the selected date range.");
    }

    const inventory = inventoryResult.rows[0];

    const existingSameReservation = await client.query(
      `
      SELECT efp.id
      FROM event_featured_placements efp
      WHERE efp.event_id = $1
        AND efp.inventory_id = $2
        AND efp.placement_status IN ('reserved', 'active')
      LIMIT 1
      `,
      [eventId, inventory.id]
    );

    if ((existingSameReservation.rowCount ?? 0) > 0) {
      await client.query("COMMIT");
      return {
        alreadyReserved: true,
        inventory,
        reservationId: existingSameReservation.rows[0].id,
        nonInventory: false,
        placementType,
      };
    }

    const reservationResult = await client.query(
      `
      INSERT INTO event_featured_placements (
        event_id,
        inventory_id,
        placement_status,
        reserved_at,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'reserved', NOW(), NOW(), NOW())
      RETURNING id, event_id, inventory_id, placement_status, reserved_at
      `,
      [eventId, inventory.id]
    );

    await client.query(
      `
      UPDATE event_submissions
      SET
        has_featured_placement = TRUE,
        featured_placement_inventory_id = $2,
        featured_placement_status = 'reserved',
        updated_at = NOW()
      WHERE id = $1
      `,
      [eventId, inventory.id]
    );

    await client.query("COMMIT");

    return {
      alreadyReserved: false,
      inventory,
      reservationId: reservationResult.rows[0].id,
      nonInventory: false,
      placementType,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}