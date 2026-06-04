import Stripe from "stripe";
import { db } from "../../config/db";
import { createPendingCampaignMedia } from "../monetization/campaignMedia.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-02-25.clover",
});

type PlacementType =
  | "event_fee"
  | "hero"
  | "homepage_top"
  | "homepage_top_row"
  | "discovery_top"
  | "discovery_top_row"
  | "featured_badge"
  | "major_events"
  | "official_flyer"
  | "org_subscription";

type CampaignItemInput = {
  placementType: PlacementType;
  placementDate: string;
  slotNumber: number | null;
  quantity: number;
  durationDays?: number | null;
  regionCode?: string | null;
};

type ReserveCampaignInput = {
  campaignName: string;
  organization: string;
  contactEmail: string;
  goal?: string | null;
  notes?: string | null;
  items: CampaignItemInput[];
  userId: string | null;
  eventId?: string | null;
  orgUuid?: string | null;
  source?: string | null;
};

type Queryable = {
  query: (text: string, params?: any[]) => Promise<any>;
};

type WeeklyPlacementAvailabilityRow = {
  sold_count: number;
  capacity: number;
};

type UploadedPromoMediaFile = {
  originalname?: string;
  mimetype?: string;
  size?: number;
  filename?: string;
  path?: string;
  destination?: string;
  location?: string;
  key?: string;
  secure_url?: string;
  url?: string;
};

type UploadCampaignPromoMediaInput = {
  campaignId: string;
  campaignItemId?: string | null;
  placementType: PlacementType;
  file: UploadedPromoMediaFile;
  uploadedByUserId?: string | null;
  uploadedByOrgUuid?: string | null;
  source?: string | null;
};

type GetCampaignPromoMediaStatusInput = {
  campaignId: string;
  placementType: PlacementType;
  campaignItemId?: string | null;
  requestedByUserId?: string | null;
};

const EVENT_FEE_CENTS = 7900;
const FEATURED_BADGE_PUBLIC_CENTS = 10900;
const FEATURED_BADGE_ORG_CENTS = 8900;
const MAJOR_EVENT_PUBLIC_CENTS = 24900;
const MAJOR_EVENT_ORG_CENTS = 14900;
const OFFICIAL_FLYER_CENTS = 4900;
const HOMEPAGE_HERO_PUBLIC_CENTS = 44900;
const HOMEPAGE_TOP_PUBLIC_CENTS = 24900;
const DISCOVERY_TOP_PUBLIC_CENTS = 22900;
const HOMEPAGE_HERO_ORG_CENTS = 39900;
const HOMEPAGE_TOP_ORG_CENTS = 20900;
const DISCOVERY_TOP_ORG_CENTS = 20900;
const ORG_SUBSCRIPTION_CENTS = 29900;

const ORG_AFRICA_HERO_CENTS = 32900;
const ORG_AFRICA_HOMEPAGE_TOP_CENTS = 22900;
const ORG_AFRICA_DISCOVERY_TOP_CENTS = 17900;
const ORG_AFRICA_MAJOR_EVENTS_CENTS = 15900;
const ORG_AFRICA_FEATURED_BADGE_CENTS = 8900;

function normalizeRegionCode(regionCode?: string | null): string {
  const normalized = String(regionCode || "USA").trim().toUpperCase();

  if (normalized === "CA") return "CANADA";
  if (normalized === "CAN") return "CANADA";
  if (normalized === "UNITED_KINGDOM") return "UK";
  if (normalized === "GB") return "UK";

  if (["USA", "CANADA", "UK", "AFRICA", "GLOBAL"].includes(normalized)) {
    return normalized;
  }

  return "USA";
}
// ================================
// CENTRAL PRICING LOGIC
// ================================

function shouldWaiveEventFee({
  waiveEventPayment,
}: {
  isOrgFlow: boolean;
  waiveEventPayment?: boolean;
  orgSubscriptionActive?: boolean;
}) {
  if (waiveEventPayment) return true;
  return false;
}

function getPlacementPrice({
  type,
  isOrgFlow,
  orgSubscriptionActive,
  regionCode,
}: {
  type: PlacementType;
  isOrgFlow: boolean;
  orgSubscriptionActive?: boolean;
  regionCode?: string | null;
}): number {
  const useOrgRates = isOrgFlow;
  const normalizedRegionCode = normalizeRegionCode(regionCode);

  if (useOrgRates && normalizedRegionCode === "AFRICA") {
    switch (type) {
      case "event_fee":
        return EVENT_FEE_CENTS;

      case "featured_badge":
        return ORG_AFRICA_FEATURED_BADGE_CENTS;

      case "major_events":
        return ORG_AFRICA_MAJOR_EVENTS_CENTS;

      case "hero":
        return ORG_AFRICA_HERO_CENTS;

      case "homepage_top":
      case "homepage_top_row":
        return ORG_AFRICA_HOMEPAGE_TOP_CENTS;

      case "discovery_top":
      case "discovery_top_row":
        return ORG_AFRICA_DISCOVERY_TOP_CENTS;
    }
  }

  switch (type) {
    case "event_fee":
      return EVENT_FEE_CENTS;

    case "featured_badge":
      return useOrgRates
        ? FEATURED_BADGE_ORG_CENTS
        : FEATURED_BADGE_PUBLIC_CENTS;

    case "major_events":
      return useOrgRates ? MAJOR_EVENT_ORG_CENTS : MAJOR_EVENT_PUBLIC_CENTS;

    case "official_flyer":
      return OFFICIAL_FLYER_CENTS;

    case "hero":
      return useOrgRates
        ? HOMEPAGE_HERO_ORG_CENTS
        : HOMEPAGE_HERO_PUBLIC_CENTS;

    case "homepage_top":
    case "homepage_top_row":
      return useOrgRates ? HOMEPAGE_TOP_ORG_CENTS : HOMEPAGE_TOP_PUBLIC_CENTS;

    case "discovery_top":
    case "discovery_top_row":
      return useOrgRates
        ? DISCOVERY_TOP_ORG_CENTS
        : DISCOVERY_TOP_PUBLIC_CENTS;

    case "org_subscription":
      return ORG_SUBSCRIPTION_CENTS;

    default:
      return 0;
  }
}

function getPlacementLabel(type: PlacementType): string {
  switch (type) {
    case "event_fee":
      return "Event Submission Fee";
    case "hero":
      return "Homepage Hero";
    case "homepage_top":
    case "homepage_top_row":
      return "Homepage Top Row";
    case "discovery_top":
    case "discovery_top_row":
      return "Discovery Top Row";
    case "featured_badge":
      return "Featured Badge";
    case "major_events":
      return "Major Events Access";
    case "official_flyer":
      return "Official Event Flyer";
    case "org_subscription":
      return "Organization Annual Subscription";
    default:
      return "Campaign Placement";
  }
}

function isOrgCampaignContext(input: {
  orgUuid?: string | null;
  source?: string | null;
}) {
  return Boolean(input.orgUuid) || input.source === "org-submit-event-monetization";
}

export function getPlacementPriceCents(
  type: PlacementType,
  options?: {
    isOrgFlow?: boolean;
    orgSubscriptionActive?: boolean;
    regionCode?: string | null;
  }
): number {
  return getPlacementPrice({
    type,
    isOrgFlow: Boolean(options?.isOrgFlow),
    orgSubscriptionActive: Boolean(options?.orgSubscriptionActive),
    regionCode: options?.regionCode || "USA",
  });
}
function normalizePlacementType(type: PlacementType): PlacementType {
  if (type === "homepage_top_row") return "homepage_top";
  if (type === "discovery_top_row") return "discovery_top";
  return type;
}

function isWeeklyPlacement(type: PlacementType): boolean {
  const normalized = normalizePlacementType(type);
  return (
    normalized === "hero" ||
    normalized === "homepage_top" ||
    normalized === "discovery_top"
  );
}

function isDurationPlacement(type: PlacementType): boolean {
  const normalized = normalizePlacementType(type);
  return normalized === "major_events";
}

function isEventLifecyclePlacement(type: PlacementType): boolean {
  const normalized = normalizePlacementType(type);
  return normalized === "featured_badge" || normalized === "official_flyer";
}

function getDefaultDurationDays(type: PlacementType): number | null {
  return normalizePlacementType(type) === "major_events" ? 21 : null;
}

function shouldAutoIncludeEventFee(input: {
  eventId?: string | null;
  source?: string | null;
}) {
  return Boolean(input.eventId) && (
    input.source === "submit-event-monetization" ||
    input.source === "org-submit-event-monetization"
  );
}

function parseUtcDateOnly(dateString: string): Date {
  const parsed = new Date(`${dateString}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateString}`);
  }

  return parsed;
}

function formatUtcDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toWeekStartUtc(dateString: string): string {
  const parsed = parseUtcDateOnly(dateString);
  const day = parsed.getUTCDay();
  parsed.setUTCDate(parsed.getUTCDate() - day);
  return formatUtcDateOnly(parsed);
}

function addUtcDays(dateString: string, days: number): string {
  const parsed = parseUtcDateOnly(dateString);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return formatUtcDateOnly(parsed);
}

function toUtcDayRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);

  return {
    startUtc: start.toISOString(),
    endUtc: end.toISOString(),
  };
}

function getAvailabilityStatus(
  isAvailable: boolean
): "available" | "unavailable" {
  return isAvailable ? "available" : "unavailable";
}

function resolveFileUrl(file: UploadedPromoMediaFile): string | null {
  if (file.secure_url) return file.secure_url;
  if (file.location) return file.location;
  if (file.url) return file.url;

  if (file.filename) {
    return `/uploads/${file.filename}`;
  }

  if (file.path) {
    const normalizedPath = String(file.path).replace(/\\/g, "/");

    const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");
    if (uploadsIndex >= 0) {
      return normalizedPath.slice(uploadsIndex);
    }

    return normalizedPath;
  }

  return null;
}

async function findWeeklyPlacementAvailability(
  client: Queryable,
  placementType: PlacementType,
  placementDate: string,
  regionCode?: string | null
): Promise<WeeklyPlacementAvailabilityRow> {
  const normalizedType = normalizePlacementType(placementType);
  const { startUtc, endUtc } = toUtcDayRange(placementDate);
  const normalizedRegionCode = normalizeRegionCode(regionCode);

  const capacity =
    normalizedType === "hero"
      ? 2
      : normalizedType === "homepage_top" || normalizedType === "discovery_top"
      ? 3
      : 0;

  const result = await client.query(
  `
  SELECT COUNT(*)::int AS sold_count
  FROM ad_campaign_items ci
  INNER JOIN ad_campaigns c
    ON c.id = ci.campaign_id
  WHERE ci.placement_type = $1
    AND ci.region_code = $2
    AND ci.placement_date >= $3::timestamptz
    AND ci.placement_date <= $4::timestamptz
    AND ci.status = 'paid'
    AND c.status = 'paid'
  `,
  [normalizedType, normalizedRegionCode, startUtc, endUtc]
);

  return {
    sold_count: result.rows?.[0]?.sold_count ?? 0,
    capacity,
  };
}

async function getLinkedEventById(
  client: Queryable,
  eventId: string | null | undefined
) {
  if (!eventId) return null;

  const result = await client.query(
    `
    SELECT
      id,
      event_code,
      org_uuid,
      owner_user_id,
      submitter_email,
      status,
      payment_status,
      title,
      waive_event_payment
    FROM event_submissions
    WHERE id = $1::uuid
    LIMIT 1
    `,
    [eventId]
  );

  return result.rows?.[0] ?? null;
}

async function getOrgSubscriptionStatus(
  client: Queryable,
  orgUuid: string | null | undefined
): Promise<boolean> {
  if (!orgUuid) return false;

  const result = await client.query(
    `
    SELECT
      subscription_status,
      subscription_expires_at
    FROM organization_accounts
    WHERE org_uuid = $1
    LIMIT 1
    `,
    [orgUuid]
  );

  const row = result.rows?.[0];
  if (!row) return false;

  if (row.subscription_status !== "active") return false;
  if (!row.subscription_expires_at) return false;

  const expiresAt = new Date(row.subscription_expires_at);
  if (Number.isNaN(expiresAt.getTime())) return false;

  return expiresAt.getTime() > Date.now();
}

async function getCampaignById(client: Queryable, campaignId: string) {
  const result = await client.query(
    `
    SELECT
      id,
      campaign_name,
      organization_name,
      contact_email,
      created_by,
      status,
      linked_event_id,
      org_uuid,
      source
    FROM ad_campaigns
    WHERE id = $1
    LIMIT 1
    `,
    [campaignId]
  );

  return result.rows?.[0] ?? null;
}

async function getCampaignItemByPlacement(
  client: Queryable,
  campaignId: string,
  placementType: PlacementType,
  campaignItemId?: string | null
) {
  const normalizedPlacementType = normalizePlacementType(placementType);

  if (campaignItemId) {
    const byIdResult = await client.query(
      `
      SELECT
        id,
        campaign_id,
        placement_type,
        placement_date,
        quantity,
        status
      FROM ad_campaign_items
      WHERE id = $1
        AND campaign_id = $2
      LIMIT 1
      `,
      [campaignItemId, campaignId]
    );

    return byIdResult.rows?.[0] ?? null;
  }

  const byTypeResult = await client.query(
    `
    SELECT
      id,
      campaign_id,
      placement_type,
      placement_date,
      quantity,
      status
    FROM ad_campaign_items
    WHERE campaign_id = $1
      AND placement_type = $2
    ORDER BY created_at ASC
    LIMIT 1
    `,
    [campaignId, normalizedPlacementType]
  );

  return byTypeResult.rows?.[0] ?? null;
}

export async function checkCampaignAvailability(items: CampaignItemInput[]) {
  const results = [];

  for (const item of items) {
    const placementType = normalizePlacementType(item.placementType);
    const placementDate =
      placementType === "event_fee" || placementType === "org_subscription"
        ? item.placementDate
        : toWeekStartUtc(item.placementDate);
    const quantity = Math.max(1, Number(item.quantity || 1));
    const durationDays =
      item.durationDays === null || item.durationDays === undefined
        ? getDefaultDurationDays(placementType)
        : Number(item.durationDays);

    const clientKey = `${placementType}|${placementDate}|${quantity}|${
      durationDays ?? "none"
    }`;

    if (
      placementType === "event_fee" ||
      placementType === "org_subscription" ||
      isEventLifecyclePlacement(placementType)
    ) {
      results.push({
        clientKey,
        placementType,
        placementDate,
        slotNumber: null,
        quantity,
        durationDays,
        availableCount: 1,
        availability: "available" as const,
      });
      continue;
    }

    if (isDurationPlacement(placementType)) {
      results.push({
        clientKey,
        placementType,
        placementDate,
        slotNumber: null,
        quantity,
        durationDays,
        availableCount: 999,
        availability: "available" as const,
      });
      continue;
    }

    let firstUnavailableWeekStartDate: string | null = null;

    for (let weekOffset = 0; weekOffset < quantity; weekOffset += 1) {
      const weekStartDate = addUtcDays(placementDate, weekOffset * 7);

      const availabilityRow = await findWeeklyPlacementAvailability(
        db,
        placementType,
        weekStartDate,
        item.regionCode
      );
      const availableCount = Math.max(
        0,
        availabilityRow.capacity - availabilityRow.sold_count
      );

      if (availableCount < 1) {
        firstUnavailableWeekStartDate = weekStartDate;
        break;
      }
    }

    const isAvailable = firstUnavailableWeekStartDate === null;

    results.push({
      clientKey,
      placementType,
      placementDate,
      slotNumber: null,
      quantity,
      durationDays: null,
      availableCount: isAvailable ? quantity : 0,
      availability: getAvailabilityStatus(isAvailable),
      unavailableWeekStartDate: firstUnavailableWeekStartDate,
    });
  }

  return results;
}

export async function getCampaignCalendarAvailability(params: {
  placementType: PlacementType;
  startDate: string;
  weeks?: number;
  regionCode?: string | null;
  eventId?: string | null,
}) {
  const placementType = normalizePlacementType(params.placementType);
  const startDate = toWeekStartUtc(params.startDate);
  const weeks = Math.max(1, Math.min(52, Number(params.weeks || 12)));
  const regionCode = normalizeRegionCode(params.regionCode);

  const calendarWeeks = [];

  if (
    placementType === "org_subscription" ||
    placementType === "event_fee" ||
    isEventLifecyclePlacement(placementType) ||
    isDurationPlacement(placementType)
  ) {
    for (let weekOffset = 0; weekOffset < weeks; weekOffset += 1) {
      const weekStartDate = addUtcDays(startDate, weekOffset * 7);

      calendarWeeks.push({
        placementType,
        weekStartDate,
        available: true,
        availability: "available" as const,
        availableCount: 999,
      });
    }

    return {
      placementType,
      startDate,
      weeks,
      calendarWeeks,
    };
  }

  for (let weekOffset = 0; weekOffset < weeks; weekOffset += 1) {
    const weekStartDate = addUtcDays(startDate, weekOffset * 7);

    const availabilityRow = await findWeeklyPlacementAvailability(
      db,
      placementType,
      weekStartDate,
      regionCode
    );

    const availableCount = Math.max(
      0,
      availabilityRow.capacity - availabilityRow.sold_count
    );

    const available = availableCount >= 1;

    calendarWeeks.push({
      placementType,
      weekStartDate,
      available,
      availability: getAvailabilityStatus(available),
      availableCount,
    });
  }

  return {
    placementType,
    startDate,
    weeks,
    calendarWeeks,
  };
}

export async function reserveCampaign(input: ReserveCampaignInput) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const linkedEvent = input.eventId
      ? await getLinkedEventById(client, input.eventId)
      : null;

    const resolvedOrgUuid = input.orgUuid || linkedEvent?.org_uuid || null;

    const campaignInsert = await client.query(
      `
      INSERT INTO ad_campaigns (
        campaign_name,
        organization_name,
        contact_email,
        goal,
        notes,
        created_by,
        status,
        linked_event_id,
        org_uuid,
        source
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'review', $7, $8, $9)
      RETURNING
        id,
        campaign_name,
        status,
        created_at,
        linked_event_id,
        org_uuid,
        source
      `,
      [
        input.campaignName,
        input.organization,
        input.contactEmail,
        input.goal || null,
        input.notes || null,
        input.userId,
        input.eventId || null,
        resolvedOrgUuid,
        input.source || null,
      ]
    );

    const campaign = campaignInsert.rows[0];
    const campaignItems = [];

    const normalizedInputItems: CampaignItemInput[] = [...input.items];

    if (
      shouldAutoIncludeEventFee({
        eventId: input.eventId || null,
        source: input.source || null,
      }) &&
      !normalizedInputItems.some((item) => item.placementType === "event_fee")
    ) {
      normalizedInputItems.unshift({
        placementType: "event_fee",
        placementDate: new Date().toISOString().slice(0, 10),
        slotNumber: null,
        quantity: 1,
        durationDays: null,
      });
    }

    for (const rawItem of normalizedInputItems) {
      const placementType = normalizePlacementType(rawItem.placementType);

      const quantity =
        placementType === "event_fee" ||
        placementType === "official_flyer" ||
        placementType === "featured_badge" ||
        placementType === "major_events" ||
        placementType === "org_subscription"
          ? 1
          : Math.max(1, Number(rawItem.quantity || 1));

      const durationDays =
        rawItem.durationDays === null || rawItem.durationDays === undefined
          ? getDefaultDurationDays(placementType)
          : Number(rawItem.durationDays);

      const normalizedPlacementDate =
        placementType === "event_fee" ||
        placementType === "org_subscription" ||
        isEventLifecyclePlacement(placementType) ||
        isDurationPlacement(placementType)
          ? rawItem.placementDate
          : isWeeklyPlacement(placementType)
          ? toWeekStartUtc(rawItem.placementDate)
          : rawItem.placementDate;

      const placementDateValue = new Date(
        `${normalizedPlacementDate}T00:00:00.000Z`
      );

      if (Number.isNaN(placementDateValue.getTime())) {
        throw new Error(`Invalid placement date for ${placementType}.`);
      }
  console.log("RAW CAMPAIGN ITEM", {
  placementType,
  rawRegionCode: rawItem.regionCode,
  normalizedRegionCode: normalizeRegionCode(rawItem.regionCode),
});

      const campaignItemInsert = await client.query(
        `
        
        INSERT INTO ad_campaign_items (
          campaign_id,
          inventory_id,
          placement_type,
          placement_date,
          slot_number,
          quantity,
          region_code,
          status
        )
        VALUES ($1, NULL, $2, $3, NULL, $4, $5, 'review')
        RETURNING *
        `,
        [
          campaign.id,
          placementType,
          placementDateValue.toISOString(),
          quantity,
          normalizeRegionCode(rawItem.regionCode),
        ]      
      );

      campaignItems.push({
        ...campaignItemInsert.rows[0],
        duration_days: durationDays,
      });
    }

    await client.query("COMMIT");

    return {
      campaign,
      items: campaignItems,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createCampaignReview(campaignId: string) {
  const result = await db.query(
    `
    SELECT
      c.id,
      c.campaign_name,
      c.organization_name,
      c.contact_email,
      c.goal,
      c.notes,
      c.status,
      c.linked_event_id,
      c.org_uuid,
      c.source,
      json_agg(
        json_build_object(
          'id', ci.id,
          'placement_type', ci.placement_type,
          'placement_date', to_char(ci.placement_date AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
          'start_date', to_char(ci.placement_date AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
          'slot_number', NULL,
          'quantity', ci.quantity,
          'duration_days',
            CASE
              WHEN ci.placement_type IN ('featured_badge', 'major_events') THEN 21
              ELSE NULL
            END,
          'status', ci.status,
          'region_code', COALESCE(ci.region_code, 'USA')
        )
        ORDER BY ci.created_at ASC
      ) AS items
    FROM ad_campaigns c
    LEFT JOIN ad_campaign_items ci
      ON ci.campaign_id = c.id
    WHERE c.id = $1
    GROUP BY c.id
    `,
    [campaignId]
  );

  if (!result.rows[0]) {
    throw new Error("Campaign review not found.");
  }

  const row = result.rows[0];
  const linkedEvent = row.linked_event_id
    ? await getLinkedEventById(db, row.linked_event_id)
    : null;
  const orgSubscriptionActive = await getOrgSubscriptionStatus(
    db,
    row.org_uuid || linkedEvent?.org_uuid || null
  );

  return {
    ...row,
    org_subscription_active: orgSubscriptionActive,
    waive_event_payment: Boolean(linkedEvent?.waive_event_payment),
    items:
      Array.isArray(row.items) && row.items.length === 1 && row.items[0] === null
        ? []
        : row.items || [],
  };
}

export async function createCampaignCheckoutSession(campaignId: string) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const campaignResult = await client.query(
      `
      SELECT
        id,
        campaign_name,
        organization_name,
        contact_email,
        created_by,
        status,
        linked_event_id,
        org_uuid,
        source
      FROM ad_campaigns
      WHERE id = $1
      FOR UPDATE
      `,
      [campaignId]
    );

    if (!campaignResult.rows.length) {
      throw new Error("Campaign not found.");
    }

    const campaign = campaignResult.rows[0];
    const linkedEvent = campaign.linked_event_id
      ? await getLinkedEventById(client, campaign.linked_event_id)
      : null;

    const orgSubscriptionActive = await getOrgSubscriptionStatus(
      client,
      campaign.org_uuid || linkedEvent?.org_uuid || null
    );

    const waiveEventPayment = shouldWaiveEventFee({
      isOrgFlow: isOrgCampaignContext({
        orgUuid: campaign.org_uuid || null,
        source: campaign.source || null,
      }),
      waiveEventPayment: Boolean(linkedEvent?.waive_event_payment),
      orgSubscriptionActive,
    });

    const itemsResult = await client.query(
      `
      SELECT
        id AS campaign_item_id,
        inventory_id,
        placement_type,
        to_char(placement_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS placement_date,
        slot_number,
        quantity,
        COALESCE(region_code, 'USA') AS region_code
      FROM ad_campaign_items
      WHERE campaign_id = $1
      ORDER BY created_at ASC
      FOR UPDATE
      `,
      [campaignId]
    );

    const items = itemsResult.rows;

    if (!items.length) {
      throw new Error("Campaign has no items for checkout.");
    }

    for (const item of items) {
      const placementType = normalizePlacementType(item.placement_type as PlacementType);

      if (!isWeeklyPlacement(placementType)) {
        continue;
      }

      const quantity = Math.max(1, Number(item.quantity || 1));
      const firstWeekStartDate = toWeekStartUtc(item.placement_date);

      for (let weekOffset = 0; weekOffset < quantity; weekOffset += 1) {
        const weekStartDate = addUtcDays(firstWeekStartDate, weekOffset * 7);

      const availabilityRow = await findWeeklyPlacementAvailability(
        client,
        placementType,
        weekStartDate,
        item.region_code
      );
        const availableCount = Math.max(
          0,
          availabilityRow.capacity - availabilityRow.sold_count
        );

        if (availableCount < 1) {
          throw new Error(
            `${getPlacementLabel(placementType)} is no longer available for the week of ${weekStartDate}.`
          );
        }
      }
    }

    const checkoutItems = items.filter((item) => {
      const placementType = normalizePlacementType(item.placement_type as PlacementType);

      if (placementType === "event_fee" && waiveEventPayment) {
        return false;
      }

      return true;
    });

    const lineItems = checkoutItems.map((item) => {
      const placementType = normalizePlacementType(item.placement_type as PlacementType);
      const quantity = item.quantity || 1;
      const isDuration = isDurationPlacement(placementType);
      const durationDays = placementType === "major_events" ? 21 : null;
      const normalizedPlacementDate = isWeeklyPlacement(placementType)
        ? toWeekStartUtc(item.placement_date)
        : item.placement_date;

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: getPlacementLabel(placementType),
            description:
              placementType === "event_fee"
                ? "Required one-time event submission fee"
                : placementType === "official_flyer"
                ? "One-time official flyer placement"
                : placementType === "org_subscription"
                ? "Annual organization subscription"
                : isDuration
                ? `Starts ${normalizedPlacementDate} · ${durationDays ?? 21} day activation`
                : quantity > 1
                ? `${quantity} weeks starting ${normalizedPlacementDate}`
                : `Week of ${normalizedPlacementDate}`,
          },
            unit_amount: getPlacementPrice({
              type: placementType,
              isOrgFlow: isOrgCampaignContext({
                orgUuid: campaign.org_uuid || null,
                source: campaign.source || null,
              }),
              orgSubscriptionActive,
              regionCode: item.region_code,
            }),        
          },
        quantity:
          placementType === "event_fee" ||
          placementType === "official_flyer" ||
          placementType === "featured_badge" ||
          placementType === "org_subscription" ||
          isDuration
            ? 1
            : quantity,
      };
    });

    if (!lineItems.length) {
      throw new Error("Campaign has no payable line items for checkout.");
    }

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://judah-global-frontend-production.up.railway.app";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${frontendUrl}/campaign-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/campaign-review`,
      customer_email: campaign.contact_email,
      metadata: {
        purchase_type: "campaign",
        campaign_id: campaign.id,
        campaignId: campaign.id,
        eventId: campaign.linked_event_id || "",
        event_id: campaign.linked_event_id || "",
        userId: campaign.created_by || "",
        user_id: campaign.created_by || "",
        org_uuid: campaign.org_uuid || "",
        source: campaign.source || "",
        waive_event_payment: waiveEventPayment ? "true" : "false",
        org_subscription_active: orgSubscriptionActive ? "true" : "false",
      },
    });

    await client.query(
      `
      UPDATE ad_campaigns
      SET status = 'pending_payment'
      WHERE id = $1
      `,
      [campaignId]
    );

    await client.query(
      `
      UPDATE ad_campaign_items
      SET status = 'pending_payment'
      WHERE campaign_id = $1
      `,
      [campaignId]
    );

    await client.query("COMMIT");

    return {
      url: session.url,
      checkoutUrl: session.url,
      sessionId: session.id,
      linkedEventId: campaign.linked_event_id || null,
      waiveEventPayment,
      orgSubscriptionActive,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function uploadCampaignPromoMedia(
  input: UploadCampaignPromoMediaInput
) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const campaign = await getCampaignById(client, input.campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    const campaignItem = await getCampaignItemByPlacement(
      client,
      input.campaignId,
      input.placementType,
      input.campaignItemId || null
    );

    if (!campaignItem) {
      throw new Error("Campaign item for placement type was not found.");
    }

    function resolveFileUrl(file: Express.Multer.File) {
      return (
        (file as any).location ||
        (file as any).path ||
        (file as any).filename ||
        file.originalname ||
        null
      );
    }
    if (!input.file) {
  throw new Error("Promo media file is required.");
}
    const fileUrl = resolveFileUrl(input.file as Express.Multer.File);

    if (!fileUrl) {
      throw new Error("Uploaded promo media file URL/path could not be resolved.");
    }
/*
      const mediaResult = await createPendingCampaignMedia({
        campaignId: input.campaignId,
        promoPurchaseId: null,
        eventId: campaign.linked_event_id ?? null,

        placementType: normalizePlacementType(input.placementType),
        mediaSlot: "primary",

        fileUrl,
        thumbnailUrl: null,

        fileSizeMB:
          input.file && typeof input.file.size === "number"
            ? Number((input.file.size / (1024 * 1024)).toFixed(2))
            : 0,

        mimeType: input.file?.mimetype || "image/jpeg",

        width: 0,
        height: 0,

        uploadedBy:
          input.uploadedByUserId ||
          input.uploadedByOrgUuid ||
          "system",

        replacesMediaId: null,
      });*/

await client.query("COMMIT");

    return {
      campaign: {
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        status: campaign.status,
      },
      campaignItem: {
        id: campaignItem.id,
        placement_type: campaignItem.placement_type,
        placement_date: campaignItem.placement_date,
        status: campaignItem.status,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getCampaignPromoMediaStatus(
  input: GetCampaignPromoMediaStatusInput
) {
  const client = await db.connect();

  try {
    const campaign = await getCampaignById(client, input.campaignId);

    if (!campaign) {
      throw new Error("Campaign not found.");
    }

    const campaignItem = await getCampaignItemByPlacement(
      client,
      input.campaignId,
      input.placementType,
      input.campaignItemId || null
    );

    if (!campaignItem) {
      throw new Error("Campaign item for placement type was not found.");
    }

    const activeResult = await client.query(
      `
      SELECT
        id,
        campaign_id,
        campaign_item_id,
        placement_type,
        file_name,
        file_url,
        mime_type,
        file_size,
        moderation_status,
        is_active,
        rejection_reason,
        approved_by_user_id,
        approved_at,
        created_at,
        updated_at
      FROM campaign_promo_media
      WHERE campaign_item_id = $1
        AND is_active = true
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 1
      `,
      [campaignItem.id]
    );

    const pendingResult = await client.query(
      `
      SELECT
        id,
        campaign_id,
        campaign_item_id,
        placement_type,
        file_name,
        file_url,
        mime_type,
        file_size,
        moderation_status,
        is_active,
        rejection_reason,
        approved_by_user_id,
        approved_at,
        created_at,
        updated_at
      FROM campaign_promo_media
      WHERE campaign_item_id = $1
        AND moderation_status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [campaignItem.id]
    );

    const latestResult = await client.query(
      `
      SELECT
        id,
        campaign_id,
        campaign_item_id,
        placement_type,
        file_name,
        file_url,
        mime_type,
        file_size,
        moderation_status,
        is_active,
        rejection_reason,
        approved_by_user_id,
        approved_at,
        created_at,
        updated_at
      FROM campaign_promo_media
      WHERE campaign_item_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [campaignItem.id]
    );

    const activeMedia = activeResult.rows?.[0] ?? null;
    const pendingMedia = pendingResult.rows?.[0] ?? null;
    const latestMedia = latestResult.rows?.[0] ?? null;

    const moderationStatus =
      pendingMedia?.moderation_status ||
      activeMedia?.moderation_status ||
      latestMedia?.moderation_status ||
      "no_media";

    return {
      campaign: {
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        status: campaign.status,
      },
      campaignItem: {
        id: campaignItem.id,
        placement_type: campaignItem.placement_type,
        placement_date: campaignItem.placement_date,
        status: campaignItem.status,
      },
      mediaStatus: {
        placement_type: normalizePlacementType(input.placementType),
        moderation_status: moderationStatus,
        has_media: Boolean(latestMedia),
        active_file_url: activeMedia?.file_url || null,
        pending_file_url: pendingMedia?.file_url || null,
        file_name:
          pendingMedia?.file_name ||
          activeMedia?.file_name ||
          latestMedia?.file_name ||
          null,
        last_uploaded_at:
          pendingMedia?.created_at ||
          latestMedia?.created_at ||
          null,
        active_media: activeMedia,
        pending_media: pendingMedia,
        latest_media: latestMedia,
        rejection_reason: latestMedia?.rejection_reason || null,
        is_persistent: true,
      },
    };
  } finally {
    client.release();
  }
}
export async function getCampaignPaymentSuccessBySessionId(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const campaignId = String(
    session.metadata?.campaign_id ||
    session.metadata?.campaignId ||
    session.metadata?.campaignID ||
    ""
  ).trim();

    if (!campaignId) {
      console.error("Stripe session metadata missing campaign ID:", {
        sessionId,
        metadata: session.metadata,
      });

  throw new Error("Campaign ID was not found on Stripe session metadata.");
}

  const review = await createCampaignReview(campaignId);

  return {
    organizationName: review.organization_name || "Organization",
    campaignName: review.campaign_name || "Reserved Campaign",
    campaignCode: `CMP-${String(review.id).replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase()}`,
    campaignId: review.id,
    eventId: review.linked_event_id || session.metadata?.event_id || null,
    orgUuid: review.org_uuid || session.metadata?.org_uuid || null,
    amountPaid: session.amount_total || null,
    status: session.payment_status || review.status || null,
  };
}