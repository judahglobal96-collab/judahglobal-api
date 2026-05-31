import { Request, Response } from "express";
import { db } from "../config/db";

/**
 * GET /api/v1/admin/media-review/pending
 */
export const getPendingMediaReviews = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT *
      FROM (
        SELECT
          em.id AS id,
          em.id AS media_id,
          'event_media' AS media_source,
          em.event_id,
          em.media_type,
          em.file_url AS media_url,
          em.file_name,
          em.mime_type,
          em.file_size_bytes AS file_size,
          em.is_primary,
          NULL::boolean AS is_active,
          em.moderation_status,
          em.moderation_reason,
          em.moderation_reviewed_at,
          em.created_at,
          em.updated_at,
          es.id AS submissions_id,
          es.event_code,
          es.title,
          es.status AS parent_status,
          es.slug,
          NULL::uuid AS campaign_id,
          NULL::uuid AS campaign_item_id,
          NULL::text AS placement_type,
          NULL::text AS campaign_name
        FROM event_media em
        INNER JOIN event_submissions es
          ON es.id = em.event_id
        WHERE em.moderation_status = 'pending'

        UNION ALL

        SELECT
          cm.id AS id,
          cm.id AS media_id,
          'campaign_media' AS media_source,
          cm.event_id,
          'campaign_media' AS media_type,
          cm.file_url AS media_url,
          cm.file_name,
          cm.mime_type,
          cm.file_size AS file_size,
          NULL::boolean AS is_primary,
          cm.is_current_live AS is_active,
          cm.moderation_status,
          cm.rejection_reason AS moderation_reason,
          cm.approved_at AS moderation_reviewed_at,
          cm.created_at,
          cm.updated_at,
          NULL::uuid AS submissions_id,
          NULL::text AS event_code,
          es.title,
          es.status AS parent_status,
          es.slug,
          cm.campaign_id,
          NULL::uuid AS campaign_item_id,
          cm.placement_type,
          NULL::text AS campaign_name
        FROM campaign_media cm
        LEFT JOIN event_submissions es
          ON es.id = cm.event_id
        WHERE cm.moderation_status = 'pending'

        SELECT
          pm.id AS id,
          pm.id AS media_id,
          'campaign_promo_media' AS media_source,
          NULL::uuid AS event_id,
          'promo_media' AS media_type,
          pm.file_url AS media_url,
          pm.file_name,
          pm.mime_type,
          pm.file_size AS file_size,
          NULL::boolean AS is_primary,
          pm.is_active,
          pm.moderation_status,
          pm.rejection_reason AS moderation_reason,
          pm.approved_at AS moderation_reviewed_at,
          pm.created_at,
          pm.updated_at,
          NULL::uuid AS submissions_id,
          NULL::text AS event_code,
          c.campaign_name AS title,
          c.status AS parent_status,
          NULL::text AS slug,
          c.id AS campaign_id,
          pm.campaign_item_id,
          COALESCE(pm.placement_type, ci.placement_type) AS placement_type,
          c.campaign_name
        FROM campaign_promo_media pm
        INNER JOIN ad_campaign_items ci
          ON ci.id = pm.campaign_item_id
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE pm.moderation_status = 'pending'
      ) AS combined_media
      WHERE media_url IS NOT NULL
        AND TRIM(media_url) <> ''
      ORDER BY created_at ASC;
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      media: result.rows,
    });
  } catch (error) {
    console.error("getPendingMediaReviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending media reviews.",
    });
  }
};

/**
 * GET /api/v1/admin/media-review/approved
 */
export const getApprovedMediaReviews = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT *
      FROM (
        SELECT
          em.id AS id,
          em.id AS media_id,
          'event_media' AS media_source,
          em.event_id,
          em.media_type,
          em.file_url AS media_url,
          em.file_name,
          em.mime_type,
          em.file_size_bytes AS file_size,
          em.is_primary,
          NULL::boolean AS is_active,
          em.moderation_status,
          em.moderation_reason,
          em.moderation_reviewed_at,
          em.created_at,
          em.updated_at,
          es.id AS submissions_id,
          es.event_code,
          es.title,
          es.status AS parent_status,
          es.slug,
          NULL::uuid AS campaign_id,
          NULL::uuid AS campaign_item_id,
          NULL::text AS placement_type,
          NULL::text AS campaign_name
        FROM event_media em
        INNER JOIN event_submissions es
          ON es.id = em.event_id
        WHERE em.moderation_status = 'approved'

        UNION ALL

        SELECT
          pm.id AS id,
          pm.id AS media_id,
          'campaign_promo_media' AS media_source,
          NULL::uuid AS event_id,
          'promo_media' AS media_type,
          pm.file_url AS media_url,
          pm.file_name,
          pm.mime_type,
          pm.file_size AS file_size,
          NULL::boolean AS is_primary,
          pm.is_active,
          pm.moderation_status,
          pm.rejection_reason AS moderation_reason,
          pm.approved_at AS moderation_reviewed_at,
          pm.created_at,
          pm.updated_at,
          NULL::uuid AS submissions_id,
          NULL::text AS event_code,
          c.campaign_name AS title,
          c.status AS parent_status,
          NULL::text AS slug,
          c.id AS campaign_id,
          pm.campaign_item_id,
          COALESCE(pm.placement_type, ci.placement_type) AS placement_type,
          c.campaign_name
        FROM campaign_promo_media pm
        INNER JOIN ad_campaign_items ci
          ON ci.id = pm.campaign_item_id
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE pm.moderation_status = 'approved'
      ) AS combined_media
      WHERE media_url IS NOT NULL
        AND TRIM(media_url) <> ''
      ORDER BY updated_at DESC NULLS LAST, created_at DESC;
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      media: result.rows,
    });
  } catch (error) {
    console.error("getApprovedMediaReviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved media.",
    });
  }
};

/**
 * GET /api/v1/admin/media-review/rejected
 */
export const getRejectedMediaReviews = async (_req: Request, res: Response) => {
  try {
    const query = `
      SELECT *
      FROM (
        SELECT
          em.id AS id,
          em.id AS media_id,
          'event_media' AS media_source,
          em.event_id,
          em.media_type,
          em.file_url AS media_url,
          em.file_name,
          em.mime_type,
          em.file_size_bytes AS file_size,
          em.is_primary,
          NULL::boolean AS is_active,
          em.moderation_status,
          em.moderation_reason,
          em.moderation_reviewed_at,
          em.created_at,
          em.updated_at,
          es.id AS submissions_id,
          es.event_code,
          es.title,
          es.status AS parent_status,
          es.slug,
          NULL::uuid AS campaign_id,
          NULL::uuid AS campaign_item_id,
          NULL::text AS placement_type,
          NULL::text AS campaign_name
        FROM event_media em
        INNER JOIN event_submissions es
          ON es.id = em.event_id
        WHERE em.moderation_status = 'rejected'

        UNION ALL

        SELECT
          pm.id AS id,
          pm.id AS media_id,
          'campaign_promo_media' AS media_source,
          NULL::uuid AS event_id,
          'promo_media' AS media_type,
          pm.file_url AS media_url,
          pm.file_name,
          pm.mime_type,
          pm.file_size AS file_size,
          NULL::boolean AS is_primary,
          pm.is_active,
          pm.moderation_status,
          pm.rejection_reason AS moderation_reason,
          pm.approved_at AS moderation_reviewed_at,
          pm.created_at,
          pm.updated_at,
          NULL::uuid AS submissions_id,
          NULL::text AS event_code,
          c.campaign_name AS title,
          c.status AS parent_status,
          NULL::text AS slug,
          c.id AS campaign_id,
          pm.campaign_item_id,
          COALESCE(pm.placement_type, ci.placement_type) AS placement_type,
          c.campaign_name
        FROM campaign_promo_media pm
        INNER JOIN ad_campaign_items ci
          ON ci.id = pm.campaign_item_id
        INNER JOIN ad_campaigns c
          ON c.id = ci.campaign_id
        WHERE pm.moderation_status = 'rejected'
      ) AS combined_media
      WHERE media_url IS NOT NULL
        AND TRIM(media_url) <> ''
      ORDER BY updated_at DESC NULLS LAST, created_at DESC;
    `;

    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      media: result.rows,
    });
  } catch (error) {
    console.error("getRejectedMediaReviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch rejected media.",
    });
  }
};

/**
 * PATCH /api/v1/admin/media-review/:mediaId/approve
 */
export const approveMediaReview = async (req: Request, res: Response) => {
  const mediaId = String(req.params.mediaId || "").trim();
  const reviewedByUserId = (req as any)?.user?.id || null;

  try {
    await db.query("BEGIN");

    const eventMediaCheck = await db.query(
      `
        SELECT event_id
        FROM event_media
        WHERE id = $1::uuid
      `,
      [mediaId]
    );

    if (eventMediaCheck.rows.length > 0) {
      const eventId = eventMediaCheck.rows[0].event_id;

      await db.query(
        `
          UPDATE event_media
          SET is_primary = false
          WHERE event_id = $1
        `,
        [eventId]
      );

      const result = await db.query(
        `
          UPDATE event_media
          SET
            moderation_status = 'approved',
            moderation_reason = NULL,
            moderation_reviewed_at = NOW(),
            is_primary = true,
            updated_at = NOW()
          WHERE id = $1::uuid
          RETURNING *;
        `,
        [mediaId]
      );

      await db.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Event media approved and set as primary.",
        media: result.rows[0],
      });
    }

    const promoMediaCheck = await db.query(
      `
        SELECT campaign_item_id
        FROM campaign_promo_media
        WHERE id = $1::uuid
      `,
      [mediaId]
    );

    if (promoMediaCheck.rows.length > 0) {
      const campaignItemId = promoMediaCheck.rows[0].campaign_item_id;

      await db.query(
        `
          UPDATE campaign_promo_media
          SET
            is_active = false,
            updated_at = NOW()
          WHERE campaign_item_id = $1::uuid
            AND is_active = true
        `,
        [campaignItemId]
      );

      const result = await db.query(
        `
          UPDATE campaign_promo_media
          SET
            moderation_status = 'approved',
            rejection_reason = NULL,
            approved_by_user_id = $2::uuid,
            approved_at = NOW(),
            is_active = true,
            updated_at = NOW()
          WHERE id = $1::uuid
          RETURNING *;
        `,
        [mediaId, reviewedByUserId]
      );

      await db.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Promo media approved and activated.",
        media: result.rows[0],
      });
    }

    await db.query("ROLLBACK");

    return res.status(404).json({
      success: false,
      message: "Media item not found.",
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("approveMediaReview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve media.",
    });
  }
};

/**
 * PATCH /api/v1/admin/media-review/:mediaId/reject
 */
export const rejectMediaReview = async (req: Request, res: Response) => {
  const mediaId = String(req.params.mediaId || "").trim();
  const reason =
    typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

  try {
    await db.query("BEGIN");

    const eventMediaCheck = await db.query(
      `
        SELECT id
        FROM event_media
        WHERE id = $1::uuid
      `,
      [mediaId]
    );

    if (eventMediaCheck.rows.length > 0) {
      const eventResult = await db.query(
        `
          UPDATE event_media
          SET
            moderation_status = 'rejected',
            moderation_reason = NULLIF($2, ''),
            moderation_reviewed_at = NOW(),
            updated_at = NOW()
          WHERE id = $1::uuid
          RETURNING *;
        `,
        [mediaId, reason]
      );

      await db.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Event media rejected successfully.",
        media: eventResult.rows[0],
      });
    }

    const promoMediaCheck = await db.query(
      `
        SELECT id
        FROM campaign_promo_media
        WHERE id = $1::uuid
      `,
      [mediaId]
    );

    if (promoMediaCheck.rows.length > 0) {
      const promoResult = await db.query(
        `
          UPDATE campaign_promo_media
          SET
            moderation_status = 'rejected',
            rejection_reason = NULLIF($2, ''),
            is_active = false,
            updated_at = NOW()
          WHERE id = $1::uuid
          RETURNING *;
        `,
        [mediaId, reason]
      );

      await db.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Promo media rejected successfully.",
        media: promoResult.rows[0],
      });
    }

    await db.query("ROLLBACK");

    return res.status(404).json({
      success: false,
      message: "Media item not found.",
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("rejectMediaReview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reject media.",
    });
  }
};

/**
 * GET /api/v1/admin/media-review/event/:eventId
 */
export const getMediaReviewEventDetail = async (
  req: Request,
  res: Response
) => {
  const { eventId } = req.params;

  try {
    const eventQuery = `
      SELECT
        id,
        slug,
        event_code,
        title,
        status,
        featured,
        created_at,
        updated_at
      FROM events
      WHERE id = $1
      LIMIT 1;
    `;

    const mediaQuery = `
      SELECT
        id AS id,
        id AS media_id,
        event_id,
        media_type,
        file_url AS media_url,
        file_name,
        mime_type,
        file_size_bytes,
        is_primary,
        moderation_status,
        moderation_reason,
        moderation_reviewed_at,
        created_at,
        updated_at
      FROM event_media
      WHERE event_id = $1
      ORDER BY is_primary DESC, created_at DESC;
    `;

    const [eventResult, mediaResult] = await Promise.all([
      db.query(eventQuery, [eventId]),
      db.query(mediaQuery, [eventId]),
    ]);

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    return res.status(200).json({
      success: true,
      event: eventResult.rows[0],
      media: mediaResult.rows,
    });
  } catch (error) {
    console.error("getMediaReviewEventDetail error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch event media review detail.",
    });
  }
};