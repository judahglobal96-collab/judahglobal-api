import { Request, Response } from "express";
import { db } from "../config/db";

function normalizePgTimezone(timezone?: string | null): string {
  if (!timezone) return "UTC";

  const value = String(timezone).trim();

  if (value.includes("/")) return value;

  const gmtMatch = value.match(/^gmt([+-])(\d{2})(\d{2})$/i);
  if (gmtMatch) {
    const [, sign, hh, mm] = gmtMatch;
    return `${sign}${hh}:${mm}`;
  }

  if (/^[+-]\d{2}:\d{2}$/.test(value)) return value;

  return "UTC";
}

function generateEventCode(): string {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EVT-${randomPart}`;
}

async function logEventAction(params: {
  eventId: string;
  eventCode?: string | null;
  actionType: string;
  actionStatus: string;
  actorUserId?: string | null;
  actorRole?: string | null;
  message?: string | null;
  errorDetail?: string | null;
  metadata?: Record<string, any>;
}) {
  try {
    await db.query(
      `
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
        $1::uuid,
        $2::text,
        $3::text,
        $4::text,
        $5::uuid,
        $6::text,
        $7::text,
        $8::text,
        $9::jsonb,
        NOW()
      )
      `,
      [
        params.eventId,
        params.eventCode ?? null,
        params.actionType,
        params.actionStatus,
        params.actorUserId ?? null,
        params.actorRole ?? null,
        params.message ?? null,
        params.errorDetail ?? null,
        JSON.stringify(params.metadata ?? {}),
      ]
    );
  } catch (logError) {
    console.error("Failed to write event action log:", logError);
  }
}

async function getPaidPromoSummary(client: any, eventId: string) {
  const result = await client.query(
    `
    SELECT
      EXISTS (
        SELECT 1
        FROM ad_campaign_items ci
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE c.linked_event_id = $1
          AND c.status = 'paid'
          AND ci.status = 'paid'
          AND ci.placement_type = 'featured_badge'
      ) AS has_paid_featured_badge,

      EXISTS (
        SELECT 1
        FROM ad_campaign_items ci
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE c.linked_event_id = $1
          AND c.status = 'paid'
          AND ci.status = 'paid'
          AND ci.placement_type = 'hero'
      ) AS has_paid_hero,

      EXISTS (
        SELECT 1
        FROM ad_campaign_items ci
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE c.linked_event_id = $1
          AND c.status = 'paid'
          AND ci.status = 'paid'
          AND ci.placement_type = 'homepage_top'
      ) AS has_paid_homepage_top,

      EXISTS (
        SELECT 1
        FROM ad_campaign_items ci
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE c.linked_event_id = $1
          AND c.status = 'paid'
          AND ci.status = 'paid'
          AND ci.placement_type = 'discovery_top'
      ) AS has_paid_discovery_top,

      EXISTS (
        SELECT 1
        FROM ad_campaign_items ci
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE c.linked_event_id = $1
          AND c.status = 'paid'
          AND ci.status = 'paid'
          AND ci.placement_type = 'major_events'
      ) AS has_paid_major_events
    `,
    [eventId]
  );

  return (
    result.rows[0] || {
      has_paid_featured_badge: false,
      has_paid_hero: false,
      has_paid_homepage_top: false,
      has_paid_discovery_top: false,
      has_paid_major_events: false,
    }
  );
}

export async function getPendingEvents(_req: Request, res: Response) {
  try {
    const result = await db.query(`
      SELECT
        id,
        event_code,
        title,
        description,
        event_type,
        submitter_email,
        status,
        payment_status,
        payment_amount_cents,
        payment_currency,
        created_at
      FROM event_submissions
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error loading pending events:", error);
    return res.status(500).json({ error: "Failed to load pending events" });
  }
}

export async function getApprovedEvents(_req: Request, res: Response) {
  try {
    const result = await db.query(`
      SELECT
        id,
        event_code,
        title,
        description,
        event_type,
        submitter_email,
        status,
        payment_status,
        payment_amount_cents,
        payment_currency,
        featured,
        created_at,
        updated_at
      FROM event_submissions
      WHERE status = 'approved'
      ORDER BY updated_at DESC, created_at DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error loading approved events:", error);
    return res.status(500).json({ error: "Failed to load approved events" });
  }
}
export async function getApprovedEventsByOrgUuid(req: Request, res: Response) {
  try {
    const orgUuid = String(req.params.orgUuid || "");

    if (!orgUuid) {
      return res.status(400).json({ error: "orgUuid is required" });
    }

    const result = await db.query(
      `
      SELECT
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.submitter_email,
        es.status,
        es.payment_status,
        es.payment_amount_cents,
        es.payment_currency,
        es.featured,
        es.created_at,
        es.updated_at,
        loc.city,
        loc.state_region,
        loc.country,
        sch.start_date
      FROM event_submissions es
      LEFT JOIN event_locations loc
        ON loc.event_id = es.id
      LEFT JOIN event_schedules sch
        ON sch.event_id = es.id
      WHERE es.status = 'approved'
        AND es.org_uuid = $1
      ORDER BY es.updated_at DESC, es.created_at DESC
      `,
      [orgUuid]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error loading approved events by org uuid:", error);
    return res.status(500).json({ error: "Failed to load approved events" });
  }
}

export async function getRejectedEvents(_req: Request, res: Response) {
  try {
    const result = await db.query(`
      SELECT
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.submitter_email,
        es.status,
        es.rejection_reason,
        es.rejected_at,
        es.rejected_by,
        es.created_at,
        es.updated_at,
        sp.sponsor_name,
        loc.city,
        loc.state_region,
        loc.country
      FROM event_submissions es
      LEFT JOIN event_sponsors sp
        ON sp.event_id = es.id
      LEFT JOIN event_locations loc
        ON loc.event_id = es.id
      WHERE es.status = 'rejected'
      ORDER BY es.rejected_at DESC NULLS LAST, es.updated_at DESC, es.created_at DESC
    `);

    return res.json(result.rows);
  } catch (error) {
    console.error("Error loading rejected events:", error);
    return res.status(500).json({ error: "Failed to load rejected events" });
  }
}

export async function getAdminEventById(req: Request, res: Response) {
  try {
    const eventId = String(req.params.eventId || "");

    const result = await db.query(
      `
      SELECT
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.submitter_email,
        es.status,
        es.payment_status,
        es.featured,
        es.created_at,
        es.updated_at,

        sch.schedule_timezone,
        sch.start_date,
        sch.end_date,
        sch.start_time,
        sch.end_time,

        loc.city,
        loc.state_region,
        loc.country,
        loc.is_virtual,

        sp.sponsor_name,
        sp.logo_url AS sponsor_logo_url,

        EXISTS (
          SELECT 1
          FROM ad_campaign_items ci
          INNER JOIN ad_campaigns c
            ON c.id = ci.campaign_id
          WHERE c.linked_event_id = es.id
            AND c.status = 'paid'
            AND ci.status = 'paid'
            AND ci.placement_type = 'featured_badge'
        ) AS has_paid_featured_badge,

        EXISTS (
          SELECT 1
          FROM ad_campaign_items ci
          INNER JOIN ad_campaigns c
            ON c.id = ci.campaign_id
          WHERE c.linked_event_id = es.id
            AND c.status = 'paid'
            AND ci.status = 'paid'
            AND ci.placement_type = 'hero'
        ) AS has_paid_hero,

        EXISTS (
          SELECT 1
          FROM ad_campaign_items ci
          INNER JOIN ad_campaigns c
            ON c.id = ci.campaign_id
          WHERE c.linked_event_id = es.id
            AND c.status = 'paid'
            AND ci.status = 'paid'
            AND ci.placement_type = 'homepage_top'
        ) AS has_paid_homepage_top,

        EXISTS (
          SELECT 1
          FROM ad_campaign_items ci
          INNER JOIN ad_campaigns c
            ON c.id = ci.campaign_id
          WHERE c.linked_event_id = es.id
            AND c.status = 'paid'
            AND ci.status = 'paid'
            AND ci.placement_type = 'discovery_top'
        ) AS has_paid_discovery_top,

        EXISTS (
          SELECT 1
          FROM ad_campaign_items ci
          INNER JOIN ad_campaigns c
            ON c.id = ci.campaign_id
          WHERE c.linked_event_id = es.id
            AND c.status = 'paid'
            AND ci.status = 'paid'
            AND ci.placement_type = 'major_events'
        ) AS has_paid_major_events,

        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'campaign_id', c.id,
              'campaign_name', c.campaign_name,
              'placement_type', ci.placement_type,
              'placement_date', ci.placement_date,
              'quantity', ci.quantity,
              'status', ci.status
            )
            ORDER BY ci.placement_date ASC
          ) FILTER (WHERE ci.id IS NOT NULL),
          '[]'::json
        ) AS paid_promos

      FROM event_submissions es
      LEFT JOIN event_schedules sch
        ON sch.event_id = es.id
      LEFT JOIN event_locations loc
        ON loc.event_id = es.id
      LEFT JOIN event_sponsors sp
        ON sp.event_id = es.id
      LEFT JOIN ad_campaigns c
        ON c.linked_event_id = es.id
       AND c.status = 'paid'
      LEFT JOIN ad_campaign_items ci
        ON ci.campaign_id = c.id
       AND ci.status = 'paid'
      WHERE es.id = $1
      GROUP BY
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.submitter_email,
        es.status,
        es.payment_status,
        es.featured,
        es.created_at,
        es.updated_at,
        sch.schedule_timezone,
        sch.start_date,
        sch.end_date,
        sch.start_time,
        sch.end_time,
        loc.city,
        loc.state_region,
        loc.country,
        loc.is_virtual,
        sp.sponsor_name,
        sp.logo_url
      LIMIT 1
      `,
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Error loading event:", error);
    return res.status(500).json({ error: "Failed to load event" });
  }
}

export async function approveEvent(req: Request, res: Response) {
  const client = await db.connect();
  const eventId = String(req.params.eventId || "");
  const actorUserId = (req as any)?.user?.id ?? null;
  const actorRole = (req as any)?.user?.role ?? null;

  try {
    await client.query("BEGIN");

    const eventCheckResult = await client.query(
      `
      SELECT
        es.id,
        es.status,
        es.payment_status,
        es.event_code,
        es.title,
        es.org_uuid,
        es.owner_user_id,
        es.featured,
        es.description,
        es.event_type,
        es.submitter_email,
        es.created_at,
        es.updated_at
      FROM event_submissions es
      WHERE es.id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (eventCheckResult.rows.length === 0) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: event not found",
        errorDetail: "Event not found",
        metadata: { source: "admin_review" },
      });

      return res.status(404).json({ error: "Event not found" });
    }

    const eventCheck = eventCheckResult.rows[0];

    if (eventCheck.status === "approved") {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode: eventCheck.event_code,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval blocked: event is already approved",
        errorDetail: "Event is already approved",
        metadata: { source: "admin_review" },
      });

      return res.status(400).json({
        success: false,
        message: "Event is already approved.",
      });
    }

    const scheduleCheckResult = await client.query(
      `
      SELECT
        id,
        event_id,
        schedule_timezone,
        start_date,
        end_date,
        start_time,
        end_time
      FROM event_schedules
      WHERE event_id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (scheduleCheckResult.rows.length === 0) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode: eventCheck.event_code,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: schedule is missing",
        errorDetail: "Cannot approve event. Schedule is missing.",
        metadata: { source: "admin_review" },
      });

      return res.status(400).json({
        success: false,
        message: "Cannot approve event. Schedule is missing.",
      });
    }

    const scheduleCheck = scheduleCheckResult.rows[0];

    if (
      !scheduleCheck.start_date ||
      !scheduleCheck.start_time ||
      !scheduleCheck.schedule_timezone
    ) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode: eventCheck.event_code,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: required schedule fields are missing",
        errorDetail:
          "Cannot approve event. Required schedule fields are missing: start_date, start_time, and timezone.",
        metadata: {
          source: "admin_review",
          start_date: scheduleCheck.start_date ?? null,
          start_time: scheduleCheck.start_time ?? null,
          schedule_timezone: scheduleCheck.schedule_timezone ?? null,
        },
      });

      return res.status(400).json({
        success: false,
        message:
          "Cannot approve event. Required schedule fields are missing: start_date, start_time, and timezone.",
      });
    }

    const startDateValue = scheduleCheck.start_date
      ? new Date(scheduleCheck.start_date).getTime()
      : null;

    const endDateValue = scheduleCheck.end_date
      ? new Date(scheduleCheck.end_date).getTime()
      : null;

    if (
      startDateValue !== null &&
      endDateValue !== null &&
      endDateValue < startDateValue
    ) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode: eventCheck.event_code,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: end date earlier than start date",
        errorDetail:
          "Cannot approve event. End date cannot be earlier than start date.",
        metadata: {
          source: "admin_review",
          start_date: scheduleCheck.start_date,
          end_date: scheduleCheck.end_date,
        },
      });

      return res.status(400).json({
        success: false,
        message: "Cannot approve event. End date cannot be earlier than start date.",
      });
    }

    const startTimeText = scheduleCheck.start_time
      ? String(scheduleCheck.start_time).split(".")[0]
      : null;

    const endTimeText = scheduleCheck.end_time
      ? String(scheduleCheck.end_time).split(".")[0]
      : null;

    if (
      scheduleCheck.start_date &&
      scheduleCheck.end_date &&
      new Date(scheduleCheck.start_date).toISOString().slice(0, 10) ===
        new Date(scheduleCheck.end_date).toISOString().slice(0, 10) &&
      startTimeText &&
      endTimeText &&
      endTimeText < startTimeText
    ) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode: eventCheck.event_code,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: end time earlier than start time",
        errorDetail:
          "Cannot approve event. End time cannot be earlier than start time on the same day.",
        metadata: {
          source: "admin_review",
          start_time: startTimeText,
          end_time: endTimeText,
        },
      });

      return res.status(400).json({
        success: false,
        message:
          "Cannot approve event. End time cannot be earlier than start time on the same day.",
      });
    }

    const isOrgEvent = !!eventCheck.org_uuid;
    const isPublicEvent = !isOrgEvent;

    if (
      isPublicEvent &&
      !["paid", "waived"].includes(
        String(eventCheck.payment_status || "").toLowerCase()
      )
    ) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode: eventCheck.event_code,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: payment not complete",
        errorDetail: "Event cannot be approved until payment is completed.",
        metadata: {
          source: "admin_review",
          payment_status: eventCheck.payment_status ?? null,
        },
      });

      return res.status(400).json({
        success: false,
        message: "Event cannot be approved until payment is completed.",
        payment_status: eventCheck.payment_status,
      });
    }

    const promoFlags = await getPaidPromoSummary(client, eventId);
    const resolvedFeaturedFlag =
      Boolean(eventCheck.featured) || Boolean(promoFlags.has_paid_featured_badge);

    const eventCode = eventCheck.event_code || generateEventCode();

    const approvedResult = await client.query(
      `
      UPDATE event_submissions
      SET
        status = 'approved',
        event_code = $2,
        featured = $3,
        approved_at = COALESCE(approved_at, NOW()),
        rejection_reason = NULL,
        rejected_at = NULL,
        rejected_by = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [eventId, eventCode, resolvedFeaturedFlag]
    );

    if (approvedResult.rows.length === 0) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed after update step: event not found",
        errorDetail: "Event not found after update",
        metadata: { source: "admin_review" },
      });

      return res.status(404).json({ error: "Event not found" });
    }

    const joinedResult = await client.query(
      `
      SELECT
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.submitter_email,
        es.status,
        es.payment_status,
        es.featured,
        es.org_uuid,
        es.created_at,
        es.updated_at,

        sch.schedule_timezone,
        sch.start_date,
        sch.end_date,
        sch.start_time,
        sch.end_time,

        loc.city,
        loc.state_region,
        loc.country,
        loc.country_code,
        loc.is_virtual,

        sp.sponsor_name,
        sp.logo_url AS sponsor_logo_url,

        media.file_url AS media_url,

        EXISTS (
          SELECT 1
          FROM ad_campaign_items ci
          INNER JOIN ad_campaigns c
            ON c.id = ci.campaign_id
          WHERE c.linked_event_id = es.id
            AND c.status = 'paid'
            AND ci.status = 'paid'
            AND ci.placement_type = 'featured_badge'
        ) AS has_paid_featured_badge

      FROM event_submissions es
      LEFT JOIN event_schedules sch
        ON sch.event_id = es.id
      LEFT JOIN event_locations loc
        ON loc.event_id = es.id
      LEFT JOIN event_sponsors sp
        ON sp.event_id = es.id
      LEFT JOIN LATERAL (
        SELECT em.file_url
        FROM event_media em
        WHERE em.event_id = es.id
          AND em.is_primary = true
        ORDER BY em.created_at DESC
        LIMIT 1
      ) media ON true
      WHERE es.id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (joinedResult.rows.length === 0) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: approved event not found for indexing",
        errorDetail: "Approved event not found for indexing",
        metadata: { source: "admin_review" },
      });

      return res.status(404).json({
        error: "Approved event not found for indexing",
      });
    }

    const event = joinedResult.rows[0];

    await client.query(`DELETE FROM event_discovery_index WHERE event_id = $1`, [
      event.id,
    ]);

    const safeStartDate = event.start_date
      ? new Date(event.start_date).toISOString().slice(0, 10)
      : null;

    const safeEndDate = event.end_date
      ? new Date(event.end_date).toISOString().slice(0, 10)
      : null;

    const normalizedStartTime = event.start_time
      ? String(event.start_time).split(".")[0].padEnd(8, ":00")
      : null;

    const normalizedEndTime = event.end_time
      ? String(event.end_time).split(".")[0].padEnd(8, ":00")
      : null;

    const pgTimezone = normalizePgTimezone(event.schedule_timezone);

    const searchText = [
      event.title,
      event.description,
      event.sponsor_name,
      event.city,
      event.state_region,
      event.country,
    ]
      .filter(Boolean)
      .join(" ");

    const startsAtLocal =
      safeStartDate && normalizedStartTime
        ? `${safeStartDate} ${normalizedStartTime}`
        : null;

    const endsAtLocal =
      safeEndDate && normalizedEndTime
        ? `${safeEndDate} ${normalizedEndTime}`
        : null;

    if (!startsAtLocal) {
      await client.query("ROLLBACK");

      await logEventAction({
        eventId,
        eventCode,
        actionType: "approve_event",
        actionStatus: "failed",
        actorUserId,
        actorRole,
        message: "Approval failed: unable to compute starts_at_utc",
        errorDetail:
          "Cannot approve event. Unable to compute starts_at_utc because schedule start date/time is incomplete.",
        metadata: {
          source: "admin_review",
          safeStartDate,
          normalizedStartTime,
          timezone: pgTimezone,
        },
      });

      return res.status(400).json({
        success: false,
        message:
          "Cannot approve event. Unable to compute starts_at_utc because schedule start date/time is incomplete.",
      });
    }

    const finalFeaturedFlag =
      Boolean(event.featured) || Boolean(event.has_paid_featured_badge);

    await client.query(
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
        updated_at,
        sponsor_logo_url,
        media_url
      )
      VALUES (
        $1::uuid,
        $2::text,
        'approved',
        $3::text,
        $4::text,
        $5::text,
        $6::text,
        $7::text,
        $8::text,
        $9::text,
        $10::text,
        $11::text,
        $12::text,
        ($13::timestamp AT TIME ZONE $12::text),
        CASE
          WHEN $14::text IS NOT NULL
            THEN ($14::timestamp AT TIME ZONE $12::text)
          ELSE NULL
        END,
        $15::date,
        COALESCE($16::boolean, false),
        COALESCE($17::boolean, false),
        to_tsvector('english', COALESCE($18::text, '')),
        NOW(),
        NOW(),
        $19::text,
        $20::text
      )
      `,
      [
        event.id,
        event.event_code || eventCode,
        event.title || null,
        event.description ? String(event.description).slice(0, 300) : null,
        event.description || null,
        event.event_type || null,
        event.sponsor_name || null,
        event.city || null,
        event.state_region || null,
        event.country || null,
        event.country_code || null,
        pgTimezone,
        startsAtLocal,
        endsAtLocal,
        safeStartDate || null,
        finalFeaturedFlag,
        event.is_virtual,
        searchText,
        event.sponsor_logo_url || null,
        event.media_url || null,
      ]
    );

    await client.query("COMMIT");

    await logEventAction({
      eventId,
      eventCode: event.event_code || eventCode,
      actionType: "approve_event",
      actionStatus: "success",
      actorUserId,
      actorRole,
      message: "Event approved and indexed successfully",
      metadata: {
        source: "admin_review",
        title: event.title,
        featured: finalFeaturedFlag,
        has_paid_featured_badge: Boolean(event.has_paid_featured_badge),
      },
    });

    return res.json({
      success: true,
      message: "Event approved successfully.",
      eventId,
      eventCode: event.event_code || eventCode,
      featured: finalFeaturedFlag,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("approveEvent error:", error);

    await logEventAction({
      eventId,
      actionType: "approve_event",
      actionStatus: "failed",
      actorUserId,
      actorRole,
      message: "Approval failed due to server error",
      errorDetail: error instanceof Error ? error.message : "Unknown error",
      metadata: { source: "admin_review" },
    });

    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to approve event",
    });
  } finally {
    client.release();
  }
}

export async function rejectEvent(req: Request, res: Response) {
  try {
    const eventId = String(req.params.eventId || "");
    const actorUserId = (req as any)?.user?.id ?? null;
    const actorRole = (req as any)?.user?.role ?? null;
    const rejectionReason =
      req.body?.rejectionReason ||
      req.body?.reason ||
      "Rejected by admin review.";

    const existing = await db.query(
      `
      SELECT id, event_code, status
      FROM event_submissions
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const event = existing.rows[0];

    await db.query(
      `
      UPDATE event_submissions
      SET
        status = 'rejected',
        rejection_reason = $2,
        rejected_at = NOW(),
        rejected_by = $3::uuid,
        updated_at = NOW()
      WHERE id = $1
      `,
      [eventId, rejectionReason, actorUserId]
    );

    await logEventAction({
      eventId,
      eventCode: event.event_code,
      actionType: "reject_event",
      actionStatus: "success",
      actorUserId,
      actorRole,
      message: "Event rejected successfully",
      metadata: {
        source: "admin_review",
        rejectionReason,
      },
    });
await db.query(
  `
      UPDATE ad_campaign_items ci
      SET status = 'rejected'
      FROM ad_campaigns c
      WHERE ci.campaign_id = c.id
        AND c.linked_event_id = $1::uuid
        AND ci.status IN ('review', 'pending_payment', 'paid')
      `,
      [eventId]
    );

    await db.query(
      `
      UPDATE ad_campaigns
      SET status = 'rejected'
      WHERE linked_event_id = $1::uuid
        AND status IN ('review', 'pending_payment', 'paid')
      `,
      [eventId]
    );

    return res.json({
      success: true,
      message: "Event rejected successfully.",
    });
  } catch (error) {
    console.error("rejectEvent error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to reject event",
    });
  }
}

export async function getEventLogs(req: Request, res: Response) {
  try {
    const eventId = String(req.params.eventId || "");

    const result = await db.query(
      `
      SELECT
        id,
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
      FROM event_action_logs
      WHERE event_id = $1
      ORDER BY created_at DESC
      `,
      [eventId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error loading event logs:", error);
    return res.status(500).json({ error: "Failed to load event logs" });
  }
}
export async function updateFeaturedStatus(req: Request, res: Response) {
  const client = await db.connect();
  const eventId = String(req.params.eventId || "");
  const actorUserId = (req as any)?.user?.id ?? null;
  const actorRole = (req as any)?.user?.role ?? null;

  try {
    const body = req.body || {};
    const featured = Boolean(body.featured);

    await client.query("BEGIN");

    const eventResult = await client.query(
      `
      SELECT id, event_code, title, featured
      FROM event_submissions
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];

    const updatedEventResult = await client.query(
      `
      UPDATE event_submissions
      SET
        featured = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, event_code, title, featured, updated_at
      `,
      [eventId, featured]
    );

    await client.query(
      `
      UPDATE event_discovery_index
      SET
        is_featured = $2,
        updated_at = NOW()
      WHERE event_id = $1
      `,
      [eventId, featured]
    );

    await client.query("COMMIT");

    await logEventAction({
      eventId,
      eventCode: event.event_code,
      actionType: "update_featured_status",
      actionStatus: "success",
      actorUserId,
      actorRole,
      message: featured
        ? "Event featured status enabled"
        : "Event featured status disabled",
      metadata: {
        source: "admin_review",
        featured,
      },
    });

    return res.json({
      success: true,
      message: featured
        ? "Featured status enabled."
        : "Featured status disabled.",
      event: updatedEventResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error updating featured status:", error);

    await logEventAction({
      eventId,
      actionType: "update_featured_status",
      actionStatus: "failed",
      actorUserId,
      actorRole,
      message: "Failed to update featured status",
      errorDetail: error instanceof Error ? error.message : String(error),
      metadata: {
        source: "admin_review",
      },
    });

    return res.status(500).json({
      error: "Failed to update featured status",
    });
  } finally {
    client.release();
  }
}
export async function getEventPaidPromos(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    const eventResult = await db.query(
      `
      SELECT id, title, event_code
      FROM event_submissions
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    const promoResult = await db.query(
      `
      SELECT
        ci.id,
        ci.campaign_id,
        c.campaign_name,
        ci.placement_type,
        ci.placement_date,
        ci.quantity,
        ci.status,
        ci.region_code,
        ci.created_at
      FROM ad_campaign_items ci
      JOIN ad_campaigns c
        ON c.id = ci.campaign_id
      WHERE c.linked_event_id = $1
      ORDER BY ci.placement_date ASC, ci.created_at ASC
      `,
      [eventId]
    );

    return res.json({
      event: eventResult.rows[0] || null,
      paidPromos: promoResult.rows,
    });
  } catch (error) {
    console.error("getEventPaidPromos error:", error);

    return res.status(500).json({
      message: "Unable to load paid promos.",
    });
  }
}
export async function getAdminSupportLookup(req: Request, res: Response) {
  try {
    const q = String(req.query.q || "").trim();

    if (!q) {
      return res.json({ results: [] });
    }

    const search = `%${q}%`;

    const result = await db.query(
      `
    SELECT
      e.id,
      e.title,
      e.event_code,
      e.event_type,
      e.status,
      e.submitter_email,
      e.updated_at,
      s.sponsor_name,
      s.contact_email AS sponsor_email
    FROM event_submissions e
    LEFT JOIN event_sponsors s
      ON s.event_id = e.id
    WHERE
      e.id::text ILIKE $1
      or e.event_code ILIKE $1
      OR e.title ILIKE $1
      OR e.submitter_email ILIKE $1
      OR s.sponsor_name ILIKE $1
      OR s.contact_email ILIKE $1
    ORDER BY e.updated_at DESC NULLS LAST
    LIMIT 25
      `,
      [search]
    );

    return res.json({ results: result.rows });
  } catch (error) {
    console.error("getAdminSupportLookup error:", error);
    return res.status(500).json({ message: "Unable to complete lookup." });
  }
}

export async function waiveEventPayment(req: Request, res: Response) {
  const client = await db.connect();
  const eventId = String(req.params.eventId || "");
  const actorUserId = (req as any)?.user?.id ?? null;
  const actorRole = (req as any)?.user?.role ?? null;

  try {
    await client.query("BEGIN");

    const eventResult = await client.query(
      `
      SELECT
        id,
        event_code,
        title,
        status,
        payment_status,
        payment_amount_cents,
        payment_currency
      FROM event_submissions
      WHERE id = $1
      LIMIT 1
      `,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Event not found" });
    }

    const event = eventResult.rows[0];

    const updatedEventResult = await client.query(
      `
      UPDATE event_submissions
      SET
        payment_status = 'waived',
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        event_code,
        title,
        status,
        payment_status,
        payment_amount_cents,
        payment_currency,
        updated_at
      `,
      [eventId]
    );

    await client.query("COMMIT");

    await logEventAction({
      eventId,
      eventCode: event.event_code,
      actionType: "waive_event_payment",
      actionStatus: "success",
      actorUserId,
      actorRole,
      message: "Event payment waived by admin",
      metadata: {
        source: "admin_review",
        previous_payment_status: event.payment_status ?? null,
        new_payment_status: "waived",
      },
    });

    return res.json({
      success: true,
      message: "Event payment waived successfully.",
      event: updatedEventResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error waiving event payment:", error);

    await logEventAction({
      eventId,
      actionType: "waive_event_payment",
      actionStatus: "failed",
      actorUserId,
      actorRole,
      message: "Failed to waive event payment",
      errorDetail: error instanceof Error ? error.message : String(error),
      metadata: {
        source: "admin_review",
      },
    });

    return res.status(500).json({
      error: "Failed to waive event payment",
    });
  } finally {
    client.release();
  }
}