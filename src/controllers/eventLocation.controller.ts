import { Request, Response } from "express";
import { db } from "../config/db";

export const saveEventLocation = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const {
      venue_name,
      address_line_1,
      address_line_2,
      city,
      state_region,
      postal_code,
      country,
      country_code,
      latitude,
      longitude,
      timezone,
      formatted_location,
      is_virtual,
      virtual_url,
    } = req.body;

    if (!eventId) {
      return res.status(400).json({
        error: "eventId is required",
      });
    }

    if (!city || !country || !timezone) {
      return res.status(400).json({
        error: "city, country, and timezone are required",
      });
    }

    const eventCheck = await db.query(
      `SELECT id, status FROM event_submissions WHERE id = $1 LIMIT 1`,
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        error: "Event not found",
      });
    }

    await db.query(`DELETE FROM event_locations WHERE event_id = $1`, [eventId]);

    const result = await db.query(
      `
      INSERT INTO event_locations (
        event_id,
        venue_name,
        address_line_1,
        address_line_2,
        city,
        state_region,
        postal_code,
        country,
        country_code,
        latitude,
        longitude,
        timezone,
        formatted_location,
        is_virtual,
        virtual_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
      `,
      [
        eventId,
        venue_name ?? null,
        address_line_1 ?? null,
        address_line_2 ?? null,
        city,
        state_region ?? null,
        postal_code ?? null,
        country,
        country_code ?? null,
        latitude ?? null,
        longitude ?? null,
        timezone,
        formatted_location ?? null,
        is_virtual ?? false,
        virtual_url ?? null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Location saved successfully",
      location: result.rows[0],
    });
  } catch (error) {
    console.error("saveEventLocation error:", error);

    return res.status(500).json({
      error: "Failed to save event location",
    });
  }
};