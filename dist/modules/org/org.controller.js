"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyOrganization = getMyOrganization;
exports.getOrgEventMetadataForEdit = getOrgEventMetadataForEdit;
exports.updateOrgEventMetadata = updateOrgEventMetadata;
exports.getOrgApprovedEvents = getOrgApprovedEvents;
const db_1 = require("../../config/db");
function getString(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}
function getBoolean(value) {
    return value === true || value === "true" || value === "1";
}
async function verifyOrgOwner(orgUuid, userId) {
    const result = await db_1.db.query(`
    SELECT id, org_uuid, organization_name, owner_user_id
    FROM organization_accounts
    WHERE org_uuid = $1
    LIMIT 1
    `, [orgUuid]);
    const org = result.rows[0];
    if (!org)
        return { ok: false, status: 404, message: "Organization not found", org: null };
    if (org.owner_user_id !== userId) {
        return { ok: false, status: 403, message: "Only the organization owner can edit event metadata.", org };
    }
    return { ok: true, status: 200, message: "OK", org };
}
async function getMyOrganization(req, res) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const query = `
      SELECT
        oa.id,
        oa.org_uuid,
        oa.organization_name,
        oa.status,
        oa.verification_status,
        oa.created_at,
        oa.updated_at,
        oa.subscription_region,
        oa.subscription_price_cents,
        oa.subscription_currency,
        oa.subscription_status,
        oa.subscription_started_at,
        oa.subscription_expires_at
      FROM organization_accounts oa
      WHERE oa.owner_user_id = $1
      LIMIT 1
    `;
        const result = await db_1.db.query(query, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No organization account found for this user",
            });
        }
        return res.status(200).json({
            success: true,
            organization: {
                ...result.rows[0],
                account_type: "Annual Organization Subscription",
            },
        });
    }
    catch (error) {
        console.error("getMyOrganization error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load organization account",
        });
    }
}
async function getOrgEventMetadataForEdit(req, res) {
    try {
        const orgUuid = String(req.params.orgUuid || "");
        const eventId = String(req.params.eventId || "");
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const ownerCheck = await verifyOrgOwner(orgUuid, req.user.id);
        if (!ownerCheck.ok) {
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message,
            });
        }
        const result = await db_1.db.query(`
      SELECT
        es.id,
        es.event_code,
        es.title,
        es.description,
        es.event_type,
        es.status,
        es.owner_user_id,

        sch.start_date,
        sch.end_date,
        sch.start_time,
        sch.end_time,
        sch.timezone,

        loc.venue_name,
        loc.address_line_1,
        loc.city,
        loc.state_region,
        loc.country,
        loc.country_code,
        loc.is_virtual,

        sp.sponsor_name,
        sp.contact_email
      FROM event_submissions es
      LEFT JOIN event_schedules sch ON sch.event_id = es.id
      LEFT JOIN event_locations loc ON loc.event_id = es.id
      LEFT JOIN event_sponsors sp ON sp.event_id = es.id
      WHERE es.id = $1
        AND es.owner_user_id = $2
      LIMIT 1
      `, [eventId, req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you do not own this event.",
            });
        }
        return res.status(200).json({
            success: true,
            event: result.rows[0],
        });
    }
    catch (error) {
        console.error("getOrgEventMetadataForEdit error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load event metadata",
        });
    }
}
async function updateOrgEventMetadata(req, res) {
    const client = await db_1.db.connect();
    try {
        const orgUuid = String(req.params.orgUuid || "");
        const eventId = String(req.params.eventId || "");
        if (!req.user?.id) {
            client.release();
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const ownerCheck = await verifyOrgOwner(orgUuid, req.user.id);
        if (!ownerCheck.ok) {
            client.release();
            return res.status(ownerCheck.status).json({
                success: false,
                message: ownerCheck.message,
            });
        }
        const { title, description, event_type, start_date, end_date, start_time, end_time, timezone, venue_name, address_line_1, city, state_region, country, country_code, is_virtual, sponsor_name, contact_email, } = req.body ?? {};
        const safeTitle = getString(title);
        const safeDescription = getString(description);
        const safeEventType = getString(event_type);
        const safeStartDate = getString(start_date);
        const safeEndDate = getString(end_date);
        const safeStartTime = getString(start_time);
        const safeEndTime = getString(end_time);
        const safeTimezone = getString(timezone);
        const safeVenueName = getString(venue_name);
        const safeAddressLine1 = getString(address_line_1);
        const safeCity = getString(city);
        const safeStateRegion = getString(state_region);
        const safeCountry = getString(country);
        const safeCountryCode = getString(country_code);
        const safeSponsorName = getString(sponsor_name);
        const safeContactEmail = getString(contact_email);
        const safeIsVirtual = getBoolean(is_virtual);
        if (!safeTitle || !safeDescription || !safeEventType) {
            client.release();
            return res.status(400).json({
                success: false,
                message: "Title, description, and event type are required.",
            });
        }
        if (!safeStartDate || !safeStartTime || !safeTimezone) {
            client.release();
            return res.status(400).json({
                success: false,
                message: "Start date, start time, and timezone are required.",
            });
        }
        if (!safeIsVirtual && (!safeCity || !safeCountry)) {
            client.release();
            return res.status(400).json({
                success: false,
                message: "City and country are required for in-person events.",
            });
        }
        await client.query("BEGIN");
        const existingResult = await client.query(`
      SELECT id, status, owner_user_id
      FROM event_submissions
      WHERE id = $1
        AND owner_user_id = $2
      LIMIT 1
      `, [eventId, req.user.id]);
        if (existingResult.rows.length === 0) {
            await client.query("ROLLBACK");
            client.release();
            return res.status(404).json({
                success: false,
                message: "Event not found or you do not own this event.",
            });
        }
        const previousStatus = existingResult.rows[0].status;
        const nextStatus = previousStatus === "approved" || previousStatus === "rejected"
            ? "pending"
            : previousStatus || "pending";
        await client.query(`
      UPDATE event_submissions
      SET
        title = $1,
        description = $2,
        event_type = $3,
        status = $4,
        updated_at = NOW()
      WHERE id = $5
        AND owner_user_id = $6
      `, [
            safeTitle,
            safeDescription,
            safeEventType,
            nextStatus,
            eventId,
            req.user.id,
        ]);
        await client.query(`
      INSERT INTO event_schedules (
        event_id,
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        schedule_type,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'one_time', NOW())
      ON CONFLICT (event_id)
      DO UPDATE SET
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        timezone = EXCLUDED.timezone,
        schedule_type = EXCLUDED.schedule_type,
        updated_at = NOW()
      `, [
            eventId,
            safeStartDate,
            safeEndDate,
            safeStartTime,
            safeEndTime,
            safeTimezone,
        ]);
        await client.query(`
      INSERT INTO event_locations (
        event_id,
        venue_name,
        address_line_1,
        city,
        state_region,
        country,
        country_code,
        is_virtual,
        timezone,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      ON CONFLICT (event_id)
      DO UPDATE SET
        venue_name = EXCLUDED.venue_name,
        address_line_1 = EXCLUDED.address_line_1,
        city = EXCLUDED.city,
        state_region = EXCLUDED.state_region,
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        is_virtual = EXCLUDED.is_virtual,
        timezone = EXCLUDED.timezone,
        updated_at = NOW()
      `, [
            eventId,
            safeVenueName,
            safeAddressLine1,
            safeCity,
            safeStateRegion,
            safeCountry,
            safeCountryCode,
            safeIsVirtual,
            safeTimezone,
        ]);
        await client.query(`
      INSERT INTO event_sponsors (
        event_id,
        sponsor_name,
        contact_email,
        sponsor_type,
        updated_at
      )
      VALUES ($1, $2, $3, 'organization', NOW())
      ON CONFLICT (event_id)
      DO UPDATE SET
        sponsor_name = EXCLUDED.sponsor_name,
        contact_email = EXCLUDED.contact_email,
        sponsor_type = EXCLUDED.sponsor_type,
        updated_at = NOW()
      `, [eventId, safeSponsorName, safeContactEmail]);
        await client.query(`DELETE FROM event_discovery_index WHERE event_id = $1`, [
            eventId,
        ]);
        await client.query("COMMIT");
        client.release();
        return res.status(200).json({
            success: true,
            message: nextStatus === "pending"
                ? "Event metadata updated and returned to pending review."
                : "Event metadata updated.",
            previousStatus,
            status: nextStatus,
        });
    }
    catch (error) {
        await client.query("ROLLBACK").catch(() => { });
        client.release();
        console.error("updateOrgEventMetadata error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to update event metadata",
        });
    }
}
async function getOrgApprovedEvents(req, res) {
    try {
        const orgUuid = String(req.params.orgUuid || "");
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const orgAccess = await db_1.db.query(`
      SELECT org_uuid
      FROM organization_accounts
      WHERE org_uuid = $1::uuid
        AND status = 'active'
      LIMIT 1
      `, [orgUuid]);
        if (orgAccess.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Organization is not active or does not exist.",
            });
        }
        /*
        const ownerCheck = await verifyOrgOwner(orgUuid, req.user.id);
    
        if (!ownerCheck.ok) {
          return res.status(ownerCheck.status).json({
            success: false,
            message: ownerCheck.message,
          });
        }*/
        const result = await db_1.db.query(`
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
      WHERE es.org_uuid = $1::uuid
        AND es.status = 'approved'
      ORDER BY sch.start_date ASC NULLS LAST, es.created_at DESC
      LIMIT 30
      `, [orgUuid]);
        return res.status(200).json({
            success: true,
            count: result.rows.length,
            data: result.rows,
        });
    }
    catch (error) {
        console.error("getOrgApprovedEvents error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load approved organization events",
        });
    }
}
