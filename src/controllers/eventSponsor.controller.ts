import { Request, Response } from "express";
import { db } from "../config/db";
import { isValidSponsorType } from "../lib/event-options";

export const saveEventSponsor = async (req: Request, res: Response) => {
  try {
    console.log("SAVE SPONSOR HIT", {
      eventId: req.params.eventId,
      body: req.body,
    });

    const { eventId } = req.params;

    const {
      sponsor_name,
      sponsor_type,
      contact_name,
      contact_email,
      contact_phone,
      website_url,
      description,
      logo_url,
    } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: "eventId is required",
      });
    }

    if (!sponsor_name || !contact_email) {
      return res.status(400).json({
        error: "sponsor_name and contact_email are required",
      });
    }

    if (!sponsor_type || !isValidSponsorType(sponsor_type)) {
      return res.status(400).json({
        error: "Invalid sponsor type",
      });
    }

    const eventCheck = await db.query(
      `SELECT id FROM event_submissions WHERE id = $1 LIMIT 1`,
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    await db.query(`DELETE FROM event_sponsors WHERE event_id = $1`, [eventId]);

    const result = await db.query(
      `
      INSERT INTO event_sponsors (
        event_id,
        sponsor_name,
        sponsor_type,
        contact_name,
        contact_email,
        contact_phone,
        website_url,
        description,
        logo_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
      `,
      [
        eventId,
        sponsor_name,
        sponsor_type,
        contact_name ?? null,
        contact_email,
        contact_phone ?? null,
        website_url ?? null,
        description ?? null,
        logo_url ?? null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Sponsor saved successfully",
      sponsor: result.rows[0],
    });
  } catch (error) {
    console.error("saveEventSponsor error:", error);

    return res.status(500).json({
      error: "Failed to save sponsor",
    });
  }
};