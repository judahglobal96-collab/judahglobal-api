"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackEventEngagement = void 0;
const db_1 = require("../config/db");
function isValidActionType(value) {
    return value === "click";
}
function isValidUuid(value) {
    if (typeof value !== "string")
        return false;
    const trimmed = value.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed);
}
const trackEventEngagement = async (req, res) => {
    try {
        const eventId = String(req.body?.eventId || "").trim();
        const actionType = req.body?.actionType;
        const source = req.body?.source ? String(req.body.source).trim() : null;
        const userId = req?.user?.id || null;
        if (!isValidUuid(eventId)) {
            return res.status(400).json({
                success: false,
                message: "eventId is required and must be a valid UUID.",
            });
        }
        if (!isValidActionType(actionType)) {
            return res.status(400).json({
                success: false,
                message: "actionType is required and must be 'click'.",
            });
        }
        const eventResult = await db_1.db.query(`
      SELECT id, event_code
      FROM event_submissions
      WHERE id = $1::uuid
      LIMIT 1
      `, [eventId]);
        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found.",
            });
        }
        const event = eventResult.rows[0];
        console.log("ENGAGEMENT LOOKUP", {
            eventId,
            eventCodeFromDb: event.event_code,
            fullEventRow: event,
        });
        const eventCode = typeof event.event_code === "string" && event.event_code.trim().length > 0
            ? event.event_code.trim()
            : null;
        console.log("ENGAGEMENT INSERT PAYLOAD", {
            eventId: event.id,
            eventCode,
            actionType,
            source,
            userId,
        });
        const insertResult = await db_1.db.query(`
      INSERT INTO event_engagement (
        event_id,
        event_code,
        action_type,
        source,
        user_id
      )
      VALUES ($1::uuid, $2, $3, $4, $5::uuid)
      RETURNING
        id,
        event_id,
        event_code,
        action_type,
        source,
        user_id,
        created_at
      `, [event.id, eventCode, actionType, source, userId]);
        return res.status(201).json({
            success: true,
            message: "Event engagement tracked successfully.",
            engagement: insertResult.rows[0],
        });
    }
    catch (error) {
        console.error("trackEventEngagement error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to track event engagement.",
        });
    }
};
exports.trackEventEngagement = trackEventEngagement;
