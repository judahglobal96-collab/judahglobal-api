import { Request, Response } from "express";
import { db } from "../config/db";

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeTime(value: string | null): string | null {
  if (!value) return null;
  return String(value).split(".")[0].padEnd(8, ":00");
}

function parsePositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function getSearchTerm(req: Request): string {
  return String(req.query.search || req.query.q || req.query.keyword || "").trim();
}

function getFilterValue(value: unknown): string {
  return String(value || "").trim();
}

function getBooleanQueryParam(value: unknown): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function buildActiveEventSql(alias = "e") {
  return `
    ${alias}.starts_at_utc IS NOT NULL
    AND ${alias}.ends_at_utc IS NOT NULL
    AND ${alias}.ends_at_utc > NOW()
  `;
}

function buildSubmissionNotExpiredSql(eventIdReference = "e.event_id") {
  return `
    EXISTS (
      SELECT 1
      FROM event_submissions es
      WHERE es.id = ${eventIdReference}
      AND (
        es.expires_at IS NULL
        OR es.expires_at > NOW()
      )
    )
  `;
}

  function buildFeaturedBadgeExistsSql(
    eventIdReference = "e.event_id",
    regionCodeReference = "'USA'"
  ) {
    return `
    EXISTS (
      SELECT 1
      FROM ad_campaign_items fci
      INNER JOIN ad_campaigns fc
        ON fc.id = fci.campaign_id
      WHERE fc.linked_event_id = ${eventIdReference}
      AND fci.placement_type = 'featured_badge'
      AND fc.status = 'paid'
      AND fci.status = 'paid'
      AND fci.region_code = ${regionCodeReference}
      AND CURRENT_DATE BETWEEN
        (fci.placement_date AT TIME ZONE 'UTC')::date
        AND (
          (fci.placement_date AT TIME ZONE 'UTC')::date + INTERVAL '20 days'
        )::date
    )
  `;
}

function toRegionCode(country?: string | null) {
  const value = String(country || "").trim().toLowerCase();

  if (value === "canada") return "CANADA";
  if (value === "united states" || value === "usa" || value === "us") return "USA";
  if (value === "africa") return "AFRICA";
  if (value === "europe") return "EUROPE";

  return "USA";
}

  function buildMajorEventExistsSql(
    eventIdReference = "e.event_id",
    regionCodeReference = "'USA'"
  ) {
    return `
    EXISTS (
      SELECT 1
      FROM ad_campaign_items mci
      INNER JOIN ad_campaigns mc
        ON mc.id = mci.campaign_id
      WHERE mc.linked_event_id = ${eventIdReference}
        AND mci.placement_type IN ('major_events', 'major_event')
        AND mc.status = 'paid'
        AND mci.status = 'paid'
        AND CURRENT_DATE BETWEEN
          (mci.placement_date AT TIME ZONE 'UTC')::date
          AND (
            (mci.placement_date AT TIME ZONE 'UTC')::date + INTERVAL '20 days'
          )::date
        AND mci.region_code = ${regionCodeReference}
    )
    `;
  }

function buildDiscoveryFilters(req: Request, useDefaultCountry = true) {
  const search = getSearchTerm(req);
  const city = getFilterValue(req.query.city);
  const stateRegion = getFilterValue(req.query.state_region);
  const country =
    getFilterValue(req.query.country) || (useDefaultCountry ? "United States" : "");
  const regionCode = toRegionCode(country);
  const category = getFilterValue(req.query.category);
  const majorEventOnly = getBooleanQueryParam(req.query.major_event);

  const majorEventExistsSql = buildMajorEventExistsSql("e.event_id", `'${regionCode}'`);
  const featuredBadgeExistsSql =   buildFeaturedBadgeExistsSql("e.event_id",  `'${regionCode}'`);

  const whereParts: string[] = [
    `e.status = 'approved'`,
    `(${buildActiveEventSql("e")})`,
    `(${buildSubmissionNotExpiredSql("e.event_id")})`,
  ];

  const params: Array<string | number> = [];
  let paramIndex = 1;

  if (search) {
    const searchParam = `%${search}%`;
    whereParts.push(`
      (
        e.title ILIKE $${paramIndex} OR
        e.short_description ILIKE $${paramIndex} OR
        e.description ILIKE $${paramIndex} OR
        e.sponsor_name ILIKE $${paramIndex} OR
        e.category_key ILIKE $${paramIndex}
      )
    `);
    params.push(searchParam);
    paramIndex += 1;
  }

  if (city) {
    whereParts.push(`e.city ILIKE $${paramIndex}`);
    params.push(`%${city}%`);
    paramIndex += 1;
  }

  if (stateRegion) {
    whereParts.push(`e.state_region ILIKE $${paramIndex}`);
    params.push(`%${stateRegion}%`);
    paramIndex += 1;
  }

  if (country) {
    whereParts.push(`e.country ILIKE $${paramIndex}`);
    params.push(`%${country}%`);
    paramIndex += 1;
  }

  if (category) {
    whereParts.push(`e.category_key ILIKE $${paramIndex}`);
    params.push(`%${category}%`);
    paramIndex += 1;
  }

  if (majorEventOnly) {
    whereParts.push(`(${majorEventExistsSql})`);
  }

  return {
    search,
    city,
    stateRegion,
    country,
    category,
    majorEventOnly,
    whereClause: whereParts.join(" AND "),
    params,
    nextParamIndex: paramIndex,
  };
}

function buildEventCardSelectSql(options: {
  mediaExpression: string;
  isMajorEventExpression: string;
  isFeaturedExpression?: string;
}) {
  const featuredExpression =
    options.isFeaturedExpression ||
    `(COALESCE(e.is_featured, false) OR ${buildFeaturedBadgeExistsSql("e.event_id")})`;

  return `
    e.event_id,
    e.event_code,
    e.title,
    e.short_description,
    e.description,
    e.city,
    e.state_region,
    e.country,
    e.timezone,
    e.starts_at_utc,
    e.ends_at_utc,
    e.sponsor_name,
    e.status,
    ${featuredExpression} AS is_featured,
    ${options.isMajorEventExpression} AS is_major_event,
    COALESCE(e.is_virtual, false) AS is_virtual,
    ${options.mediaExpression} AS media_url,
    sp.logo_url AS sponsor_logo_url
  `;
}

async function getPromoPlacementsByTypes(
  placementTypes: string[],
  limit: number,
  region?: string
) {
  const majorEventExistsSql = buildMajorEventExistsSql("e.event_id");

  const result = await db.query(
    `
    SELECT DISTINCT ON (ci.id)
      ci.placement_type,
      ci.placement_date,
      ${buildEventCardSelectSql({
        mediaExpression: "cm.file_url",
        isMajorEventExpression: `(${majorEventExistsSql})`,
      })}
    FROM ad_campaign_items ci
    INNER JOIN ad_campaigns c
      ON c.id = ci.campaign_id
    INNER JOIN campaign_media cm
      ON cm.campaign_id = c.id
      AND cm.placement_type = ci.placement_type
      AND cm.moderation_status = 'approved'
      AND cm.lifecycle_status = 'active'
      AND cm.deployment_status = 'live'
      AND cm.is_current_live = true
    INNER JOIN event_discovery_index e
      ON e.event_id = c.linked_event_id
      AND e.status = 'approved'
      AND ${buildActiveEventSql("e")}
    LEFT JOIN event_sponsors sp
      ON sp.event_id = e.event_id
    WHERE ci.placement_type = ANY($1::text[])
      AND c.status = 'paid'
      AND ci.status = 'paid'
      AND (${buildSubmissionNotExpiredSql("e.event_id")})
      AND ci.region_code = $3::text
      AND CURRENT_DATE BETWEEN
        (ci.placement_date AT TIME ZONE 'UTC')::date
        AND (
          (ci.placement_date AT TIME ZONE 'UTC')::date +
          ((GREATEST(ci.quantity, 1) * 7) - 1) * INTERVAL '1 day'
        )::date
    ORDER BY
      ci.id,
      cm.approved_at DESC NULLS LAST,
      cm.updated_at DESC,
      e.starts_at_utc ASC
    LIMIT $2
    `,
[
  placementTypes, limit, toRegionCode(region || "United States")]
  );

  return result.rows;
}

export async function getAllDiscoveredEvents(req: Request, res: Response) {
  try {
    const result = await db.query(`
      SELECT
        event_id,
        title,
        city,
        starts_at_utc
      FROM event_discovery_index
      WHERE status = 'approved'
      AND ${buildActiveEventSql("event_discovery_index")}
      LIMIT 5
    `);

    return res.json({
      success: true,
      results: result.rows,
    });
  } catch (error: any) {
    console.error("SIMPLE EVENTS TEST ERROR FULL:", error);
    return res.status(500).json({
      error: "Simple events test failed",
      databaseUrlExists: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL
        ? process.env.DATABASE_URL.slice(0, 35)
        : null,
      databaseUrlHost: process.env.DATABASE_URL
        ? new URL(process.env.DATABASE_URL).host
        : null,
      errorName: error?.name,
      errorMessage: error?.message,
      errorCode: error?.code,
      errors: error?.errors?.map((e: any) => ({
        code: e?.code,
        message: e?.message,
        address: e?.address,
        port: e?.port,
      })),
    });
  }
}

export async function getFeaturedEvents(_req: Request, res: Response) {
  try {
    const featuredBadgeExistsSql = buildFeaturedBadgeExistsSql("e.event_id");
    const majorEventExistsSql = buildMajorEventExistsSql("e.event_id");

    const result = await db.query(
      `
      SELECT
        ${buildEventCardSelectSql({
          mediaExpression: "COALESCE(media.file_url, featured_cm.file_url)",
          isMajorEventExpression: `(${majorEventExistsSql})`,
          isFeaturedExpression: `(COALESCE(e.is_featured, false) OR ${featuredBadgeExistsSql})`,
        })}
      FROM event_discovery_index e
      LEFT JOIN LATERAL (
        SELECT em.file_url
        FROM event_media em
        WHERE em.event_id = e.event_id
          AND em.is_primary = true
          AND em.moderation_status = 'approved'
        ORDER BY em.created_at DESC
        LIMIT 1
      ) media ON true
      LEFT JOIN LATERAL (
        SELECT cm.file_url
        FROM campaign_media cm
        INNER JOIN ad_campaigns c
          ON c.id = cm.campaign_id
        INNER JOIN ad_campaign_items ci
          ON ci.campaign_id = c.id
          AND ci.placement_type = cm.placement_type
        WHERE c.linked_event_id = e.event_id
          AND cm.placement_type = 'featured_badge'
          AND cm.moderation_status = 'approved'
          AND cm.lifecycle_status = 'active'
          AND cm.deployment_status = 'live'
          AND cm.is_current_live = true
          AND c.status = 'paid'
          AND ci.status = 'paid'
        ORDER BY cm.approved_at DESC NULLS LAST, cm.updated_at DESC
        LIMIT 1
      ) 
        featured_cm ON true
      LEFT JOIN event_sponsors sp
        ON sp.event_id = e.event_id
      WHERE e.status = 'approved'
        AND ${buildActiveEventSql("e")}
        AND (${buildSubmissionNotExpiredSql("e.event_id")})
        AND (COALESCE(e.is_featured, false) = true OR ${featuredBadgeExistsSql})
      ORDER BY e.starts_at_utc ASC
      `
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error loading featured events:", error);
    return res.status(500).json({ error: "Failed to load featured events" });
  }
}

export async function getHomepageHeroPlacement(_req: Request, res: Response) {
  try {
    const results = await getPromoPlacementsByTypes(["hero"], 2);
    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error loading homepage hero placement:", error);
    return res.status(500).json({
      error: "Failed to load homepage hero placement",
    });
  }
}

export async function getHomepageTopRowPlacements(req: Request, res: Response) {
  try {
    const region = String(req.query.region || "").trim();

    const results = await getPromoPlacementsByTypes(
      ["homepage_top", "homepage_top_row"],
      3,
      region
    );

    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error loading homepage top row placements:", error);
    return res.status(500).json({
      error: "Failed to load homepage top row placements",
    });
  }
}

export async function getDiscoveryTopRowPlacements(req: Request, res: Response) {
  try {
    const region = String(req.query.region || "").trim();

    const results = await getPromoPlacementsByTypes(
      ["discovery_top", "discovery_top_row"],
      3,
      region
    );

    return res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error loading discovery top row placements:", error);
    return res.status(500).json({
      error: "Failed to load discovery top row placements",
    });
  }
}

export const getHomepagePromos = async (req: Request, res: Response) => {
  try {
    const region = String(req.query.region || "").trim();

    const hero = await getPromoPlacementsByTypes(["hero"], 2, region);
    const topRow = await getPromoPlacementsByTypes(
      ["homepage_top", "homepage_top_row"],
      3,
      region
    );

    return res.json({
      success: true,
      hero,
      topRow,
    });
  } catch (err) {
    console.error("getHomepagePromos error:", err);
    return res.status(500).json({ success: false });
  }
};

export async function getMajorEvents(req: Request, res: Response) {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = parsePositiveInt(req.query.limit, 12);
    const offset = (page - 1) * limit;
    const region = String(req.query.region || req.query.country || "").trim();
    const regionCode = toRegionCode(region || "United States");

    const countQuery = `
      SELECT COUNT(DISTINCT e.event_id)::int AS total
      FROM ad_campaign_items ci
      INNER JOIN ad_campaigns c
        ON c.id = ci.campaign_id
      INNER JOIN event_discovery_index e
        ON e.event_id = c.linked_event_id
        AND e.status = 'approved'
        AND ${buildActiveEventSql("e")}
      WHERE ci.placement_type IN ('major_events', 'major_event')
        AND c.status = 'paid'
        AND ci.status = 'paid'
        AND (${buildSubmissionNotExpiredSql("e.event_id")})
        AND 
          ci.region_code = $1::text
        AND CURRENT_DATE BETWEEN
          (ci.placement_date AT TIME ZONE 'UTC')::date
          AND (
            (ci.placement_date AT TIME ZONE 'UTC')::date + INTERVAL '20 days'
          )::date
    `;

    const countResult = await db.query(countQuery, [regionCode]);
    const total = countResult.rows[0]?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const featuredBadgeExistsSql = buildFeaturedBadgeExistsSql("e.event_id", "$3::text");

    const result = await db.query(
      `
      SELECT DISTINCT ON (e.event_id)
        ${buildEventCardSelectSql({
          mediaExpression: "cm.file_url",
          isMajorEventExpression: "true",
          isFeaturedExpression: `(COALESCE(e.is_featured, false) OR ${featuredBadgeExistsSql})`,
        })},
        (
          (ci.placement_date AT TIME ZONE 'UTC')::date + INTERVAL '20 days'
        ) AS major_event_expires_at
      FROM ad_campaign_items ci
      INNER JOIN ad_campaigns c
        ON c.id = ci.campaign_id
      INNER JOIN event_discovery_index e
        ON e.event_id = c.linked_event_id
        AND e.status = 'approved'
        AND ${buildActiveEventSql("e")}
      LEFT JOIN event_sponsors sp
        ON sp.event_id = e.event_id
      WHERE ci.placement_type IN ('major_events', 'major_event')
        AND c.status = 'paid'
        AND ci.status = 'paid'
        AND (${buildSubmissionNotExpiredSql("e.event_id")})
        AND ci.region_code = $3::text
        AND CURRENT_DATE BETWEEN
          (ci.placement_date AT TIME ZONE 'UTC')::date
          AND (
            (ci.placement_date AT TIME ZONE 'UTC')::date + INTERVAL '20 days'
          )::date
        ORDER BY
          e.event_id,
          cm.approved_at DESC NULLS LAST,
          cm.updated_at DESC,
          e.starts_at_utc ASC
        LIMIT $1
        OFFSET $2      
        `,
      [limit, offset, regionCode]
    );
console.log("MAJOR EVENTS region:", region);
console.log("MAJOR EVENTS regionCode:", regionCode);
console.log("MAJOR EVENTS total:", total);
console.log("MAJOR EVENTS rows:", result.rows.length, result.rows);

    return res.json({
      success: true,
      page,
      limit,
      total,
      total_pages: totalPages,
      results: result.rows,
    });
  } catch (error) {
    console.error("Error loading major events:", error);
    return res.status(500).json({ error: "Failed to load major events" });
  }
}

export async function searchDiscoveredEvents(req: Request, res: Response) {
  try {
    const {
      whereClause,
      params,
      search,
      city,
      stateRegion,
      country,
      category,
      majorEventOnly,
    } = buildDiscoveryFilters(req);

    const featuredBadgeExistsSql = buildFeaturedBadgeExistsSql("e.event_id");
    const majorEventExistsSql = buildMajorEventExistsSql("e.event_id");

    const result = await db.query(
      `
      SELECT
        ${buildEventCardSelectSql({
          mediaExpression: "COALESCE(media.file_url, event_campaign_media.file_url)",
          isMajorEventExpression: `(${majorEventExistsSql})`,
          isFeaturedExpression: `(COALESCE(e.is_featured, false) OR ${featuredBadgeExistsSql})`,
        })}
      FROM event_discovery_index e
      LEFT JOIN LATERAL (
        SELECT em.file_url
        FROM event_media em
        WHERE em.event_id = e.event_id
          AND em.is_primary = true
          AND em.moderation_status = 'approved'
        ORDER BY em.created_at DESC
        LIMIT 1
      ) media ON true
      LEFT JOIN LATERAL (
        SELECT cm.file_url
        FROM campaign_media cm
        WHERE cm.event_id = e.event_id
          AND cm.moderation_status = 'approved'
          AND cm.lifecycle_status = 'active'
          AND cm.deployment_status = 'live'
          AND cm.is_current_live = true
        ORDER BY cm.approved_at DESC NULLS LAST, cm.updated_at DESC
        LIMIT 1
      ) event_campaign_media ON true
      LEFT JOIN event_sponsors sp
        ON sp.event_id = e.event_id
      WHERE ${whereClause}
      ORDER BY
        (${majorEventExistsSql}) DESC,
        (COALESCE(e.is_featured, false) OR ${featuredBadgeExistsSql}) DESC,
        e.starts_at_utc ASC
      `,
      params
    );

    return res.json({
      success: true,
      filters: {
        search,
        city,
        state_region: stateRegion,
        country,
        category,
        major_event: majorEventOnly,
      },
      results: result.rows,
    });
  } catch (error) {
    console.error("Error searching discovered events:", error);
    return res.status(500).json({ error: "Failed to search discovered events" });
  }
}

export async function getDiscoveredEventById(req: Request, res: Response) {
  try {
    const eventIdParam = req.params.eventId;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

    if (!eventId || !isValidUuid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const featuredBadgeExistsSql = buildFeaturedBadgeExistsSql("e.event_id");
    const majorEventExistsSql = buildMajorEventExistsSql("e.event_id");

    const result = await db.query(
      `
      SELECT
        ${buildEventCardSelectSql({
          mediaExpression:
            "COALESCE(media.file_url, campaign_cover.file_url, official_flyer.file_url)",
          isMajorEventExpression: `(${majorEventExistsSql})`,
          isFeaturedExpression: `(COALESCE(e.is_featured, false) OR ${featuredBadgeExistsSql})`,
        })},
        campaign_cover.file_url AS campaign_media_url,
        sp.contact_email,
        loc.venue_name,
        loc.address_line_1 AS address_line_1,
        loc.city AS location_city,
        loc.state_region AS location_state,
        official_flyer.file_url AS official_flyer_url
      FROM event_discovery_index e
      LEFT JOIN LATERAL (
        SELECT em.file_url
        FROM event_media em
        WHERE em.event_id = e.event_id
          AND em.is_primary = true
          AND em.moderation_status = 'approved'
        ORDER BY em.created_at DESC
        LIMIT 1
      ) media ON true
      LEFT JOIN LATERAL (
        SELECT cm.file_url
        FROM campaign_media cm
        INNER JOIN ad_campaigns c
          ON c.id = cm.campaign_id
        INNER JOIN ad_campaign_items ci
          ON ci.campaign_id = c.id
          AND ci.placement_type = cm.placement_type
        WHERE c.linked_event_id = e.event_id
          AND cm.placement_type IN (
            'hero',
            'homepage_top',
            'homepage_top_row',
            'discovery_top',
            'discovery_top_row',
            'major_events',
            'major_event',
            'featured_badge'
          )
          AND cm.moderation_status = 'approved'
          AND cm.lifecycle_status = 'active'
          AND cm.deployment_status = 'live'
          AND cm.is_current_live = true
          AND c.status = 'paid'
          AND ci.status = 'paid'
        ORDER BY cm.approved_at DESC NULLS LAST, cm.updated_at DESC
        LIMIT 1
      ) campaign_cover ON true
      LEFT JOIN LATERAL (
        SELECT cm.file_url
        FROM campaign_media cm
        WHERE cm.event_id = e.event_id
          AND cm.placement_type = 'official_flyer'
          AND cm.moderation_status = 'approved'
          AND cm.lifecycle_status = 'active'
          AND cm.deployment_status = 'live'
          AND cm.is_current_live = true
        ORDER BY cm.approved_at DESC NULLS LAST, cm.created_at DESC
        LIMIT 1
      ) official_flyer ON true
      LEFT JOIN event_sponsors sp
        ON sp.event_id = e.event_id
      LEFT JOIN event_locations loc
        ON loc.event_id = e.event_id
      WHERE e.event_id = $1
        AND e.status = 'approved'
        AND ${buildActiveEventSql("e")}
        AND (${buildSubmissionNotExpiredSql("e.event_id")})
      LIMIT 1
      `,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Discovered event not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error loading discovered event:", error);
    return res.status(500).json({ error: "Failed to load discovered event" });
  }
}

export async function indexEventForDiscovery(req: Request, res: Response) {
  try {
    const eventIdParam = req.params.eventId;
    const eventId = Array.isArray(eventIdParam) ? eventIdParam[0] : eventIdParam;

    console.log("=== MANUAL INDEX START ===");
    console.log("MANUAL INDEX eventId:", eventId);

    if (!eventId || !isValidUuid(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const joinedResult = await db.query(
      `
      SELECT
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.submitter_email,
        sch.timezone AS schedule_timezone,
        sch.start_date,
        sch.end_date,
        sch.start_time,
        sch.end_time,
        loc.city,
        loc.state_region,
        loc.country,
        loc.country_code,
        loc.is_virtual,
        sp.sponsor_name
      FROM event_submissions es
      LEFT JOIN event_schedules sch ON sch.event_id = es.id
      LEFT JOIN event_locations loc ON loc.event_id = es.id
      LEFT JOIN event_sponsors sp ON sp.event_id = es.id
      WHERE es.id = $1
      LIMIT 1
      `,
      [eventId]
    );

    console.log("MANUAL JOIN ROW COUNT:", joinedResult.rows.length);
    console.log("MANUAL JOIN FIRST ROW:", joinedResult.rows[0]);

    if (joinedResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found for indexing" });
    }

    const event = joinedResult.rows[0];

    if (!event.title) {
      return res.status(500).json({ error: "Missing event title" });
    }

    if (!event.start_date || !event.start_time) {
      return res.status(500).json({ error: "Missing event schedule fields" });
    }

    if (!event.end_date || !event.end_time) {
      return res.status(500).json({ error: "Missing event end schedule fields" });
    }

    if (!event.city || !event.country) {
      return res.status(500).json({ error: "Missing event location fields" });
    }

    if (!event.schedule_timezone) {
      return res.status(500).json({ error: "Missing timezone" });
    }

    const normalizedStartTime = normalizeTime(event.start_time);
    const normalizedEndTime = normalizeTime(event.end_time);
    const shortDescription = event.description?.slice(0, 300) ?? null;
    const sponsorName = event.sponsor_name ?? event.submitter_email ?? null;

    await db.query(`DELETE FROM event_discovery_index WHERE event_id = $1`, [
      event.id,
    ]);

    await db.query(
      `
      INSERT INTO event_discovery_index (
        event_id,
        event_code,
        status,
        title,
        short_description,
        description,
        category_key,
        sponsor_name,
        city,
        state_region,
        country,
        country_code,
        timezone,
        starts_at_utc,
        ends_at_utc,
        occurrence_date,
        is_featured,
        is_virtual,
        search_document,
        created_at,
        updated_at
      )
      VALUES (
        $1::uuid,
        $2::varchar(40),
        'approved'::varchar(20),
        $3::varchar(180),
        $4::varchar(300),
        $5::text,
        $6::varchar(100),
        $7::varchar(180),
        $8::varchar(120),
        $9::varchar(120),
        $10::varchar(120),
        $11::varchar(10),
        $12::varchar(80),
        (($13::date + $14::time) AT TIME ZONE $17::text),
        (($15::date + $16::time) AT TIME ZONE $17::text),
        $13::date,
        false,
        COALESCE($18, false),
        to_tsvector(
          'english',
          coalesce($3::text, '') || ' ' ||
          coalesce($5::text, '') || ' ' ||
          coalesce($7::text, '') || ' ' ||
          coalesce($8::text, '') || ' ' ||
          coalesce($9::text, '') || ' ' ||
          coalesce($10::text, '')
        ),
        NOW(),
        NOW()
      )
      `,
      [
        event.id,
        event.event_code,
        event.title,
        shortDescription,
        event.description,
        event.event_type,
        sponsorName,
        event.city,
        event.state_region,
        event.country,
        event.country_code,
        event.schedule_timezone,
        event.start_date,
        normalizedStartTime,
        event.end_date,
        normalizedEndTime,
        event.schedule_timezone,
        event.is_virtual,
      ]
    );

    console.log("=== MANUAL INDEX SUCCESS ===", event.id);

    return res.status(200).json({
      success: true,
      message: "Event indexed successfully",
      eventId: event.id,
    });
  } catch (error) {
    console.error("MANUAL INDEX ERROR:", error);
    return res.status(500).json({
      error: "Failed to index event",
      details: error instanceof Error ? error.message : error,
    });
  }
}