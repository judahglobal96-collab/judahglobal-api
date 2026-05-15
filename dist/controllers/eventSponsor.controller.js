"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveEventSponsor = void 0;
const db_1 = require("../config/db");
const event_options_1 = require("../lib/event-options");
const saveEventSponsor = async (req, res) => {
    try {
        console.log("SAVE SPONSOR HIT", {
            eventId: req.params.eventId,
            body: req.body,
        });
        const { eventId } = req.params;
        const { sponsor_name, sponsor_type, contact_name, contact_email, contact_phone, website_url, description, logo_url, } = req.body;
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
        if (!sponsor_type || !(0, event_options_1.isValidSponsorType)(sponsor_type)) {
            return res.status(400).json({
                error: "Invalid sponsor type",
            });
        }
        const eventCheck = await db_1.db.query(`SELECT id FROM event_submissions WHERE id = $1 LIMIT 1`, [eventId]);
        if (eventCheck.rows.length === 0) {
            return res.status(404).json({
                error: "Event not found",
            });
        }
        await db_1.db.query(`DELETE FROM event_sponsors WHERE event_id = $1`, [eventId]);
        const result = await db_1.db.query(`
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
      `, [
            eventId,
            sponsor_name,
            sponsor_type,
            contact_name ?? null,
            contact_email,
            contact_phone ?? null,
            website_url ?? null,
            description ?? null,
            logo_url ?? null,
        ]);
        return res.status(201).json({
            success: true,
            message: "Sponsor saved successfully",
            sponsor: result.rows[0],
        });
    }
    catch (error) {
        console.error("saveEventSponsor error:", error);
        return res.status(500).json({
            error: "Failed to save sponsor",
        });
    }
};
exports.saveEventSponsor = saveEventSponsor;
