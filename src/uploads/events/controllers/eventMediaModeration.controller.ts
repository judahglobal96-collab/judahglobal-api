import { Request, Response } from "express";
import { db } from "../../../config/db";

export async function getPendingEventMedia(_req: Request, res: Response) {
  try {
    const result = await db.query(
      `
      SELECT
        em.id,
        em.event_id,
        em.media_type,
        em.file_url,
        em.file_name,
        em.mime_type,
        em.file_size_bytes,
        em.is_primary,
        em.moderation_status,
        em.moderation_reason,
        em.created_at,
        em.updated_at,
        es.title,
        es.status AS event_status
      FROM event_media em
      INNER JOIN event_submissions es
        ON es.id = em.event_id
      WHERE em.moderation_status = 'pending'
      ORDER BY em.created_at ASC
      `
    );

    return res.status(200).json({
      success: true,
      media: result.rows,
    });
  } catch (error) {
    console.error("GET_PENDING_EVENT_MEDIA_ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load pending event media.",
    });
  }
}

export async function approveEventMedia(req: Request, res: Response) {
  try {
    const { mediaId } = req.params;

    const result = await db.query(
      `
      UPDATE event_media
      SET
        moderation_status = 'approved',
        moderation_reason = NULL,
        moderation_reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [mediaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media approved successfully.",
      media: result.rows[0],
    });
  } catch (error) {
    console.error("APPROVE_EVENT_MEDIA_ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve media.",
    });
  }
}

export async function rejectEventMedia(req: Request, res: Response) {
  try {
    const { mediaId } = req.params;
    const { moderation_reason } = req.body;

    const result = await db.query(
      `
      UPDATE event_media
      SET
        moderation_status = 'rejected',
        moderation_reason = $2,
        moderation_reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [mediaId, moderation_reason || null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Media not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Media rejected successfully.",
      media: result.rows[0],
    });
  } catch (error) {
    console.error("REJECT_EVENT_MEDIA_ERROR", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject media.",
    });
  }
}