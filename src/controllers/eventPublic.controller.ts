import type { Request, Response } from "express";
import { db } from "../config/db";

export async function getPublicEventBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Event slug or ID is required",
      });
    }

    const result = await db.query(
      `
      SELECT
        event_id,
        event_slug,
        title
      FROM event_discovery_index
      WHERE event_slug = $1
         OR event_id::text = $1
      LIMIT 1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const event = result.rows[0];

    return res.status(200).json({
      success: true,
      event: {
        id: event.event_id,
        event_id: event.event_id,
        slug: event.event_slug,
        title: event.title,
      },
    });
  } catch (error: any) {
    console.error("getPublicEventBySlug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load event",
      error: error?.message,
      code: error?.code,
      detail: error?.detail,
    });
  }
}