"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitEventForReview = submitEventForReview;
const db_1 = require("../config/db");
const eventVerification_service_1 = require("../services/eventVerification.service");
const event_options_1 = require("../lib/event-options");
async function submitEventForReview(req, res) {
    const { event_id, schedule, location, sponsor } = req.body;
    console.log("ORG SUBMIT HANDLER HIT:", {
        event_id: req.body?.event_id,
        params: req.params,
        body_org_uuid: req.body?.org_uuid,
        user_id: req?.user?.id,
    });
    if (!event_id) {
        return res.status(400).json({ error: "event_id required" });
    }
    try {
        await db_1.db.query(`
      INSERT INTO event_schedules (
        event_id,
        schedule_type,
        timezone,
        start_date,
        end_date,
        start_time,
        end_time,
        is_all_day,
        recurrence_days,
        recurrence_interval,
        recurrence_until
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (event_id) DO UPDATE SET
        schedule_type = EXCLUDED.schedule_type,
        timezone = EXCLUDED.timezone,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        is_all_day = EXCLUDED.is_all_day,
        recurrence_days = EXCLUDED.recurrence_days,
        recurrence_interval = EXCLUDED.recurrence_interval,
        recurrence_until = EXCLUDED.recurrence_until,
        updated_at = NOW()
      `, [
            event_id,
            schedule?.scheduleType || "one_time",
            schedule?.timezone || "UTC",
            schedule?.startDate || null,
            schedule?.endDate || null,
            schedule?.startTime || null,
            schedule?.endTime || null,
            schedule?.isAllDay || false,
            schedule?.recurrenceDays || null,
            schedule?.recurrenceInterval || 1,
            schedule?.recurrenceUntil || null,
        ]);
        await db_1.db.query(`
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      ON CONFLICT (event_id) DO UPDATE SET
        venue_name = EXCLUDED.venue_name,
        address_line_1 = EXCLUDED.address_line_1,
        address_line_2 = EXCLUDED.address_line_2,
        city = EXCLUDED.city,
        state_region = EXCLUDED.state_region,
        postal_code = EXCLUDED.postal_code,
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        timezone = EXCLUDED.timezone,
        formatted_location = EXCLUDED.formatted_location,
        is_virtual = EXCLUDED.is_virtual,
        virtual_url = EXCLUDED.virtual_url,
        updated_at = NOW()
      `, [
            event_id,
            location?.venueName || null,
            location?.addressLine1 || null,
            location?.addressLine2 || null,
            location?.city || null,
            location?.stateRegion || null,
            location?.postalCode || null,
            location?.country || null,
            location?.countryCode || null,
            location?.latitude || null,
            location?.longitude || null,
            location?.timezone || schedule?.timezone || "UTC",
            location?.formattedLocation || null,
            location?.isVirtual || false,
            location?.virtualUrl || null,
        ]);
        if (sponsor?.sponsorType && !(0, event_options_1.isValidSponsorType)(sponsor.sponsorType)) {
            return res.status(400).json({
                error: "Invalid sponsor type",
            });
        }
        await db_1.db.query(`
      INSERT INTO event_sponsors (
        event_id,
        sponsor_name,
        sponsor_type,
        contact_name,
        contact_email,
        contact_phone,
        website_url,
        instagram_url,
        facebook_url,
        description,
        logo_url
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (event_id) DO UPDATE SET
        sponsor_name = EXCLUDED.sponsor_name,
        sponsor_type = EXCLUDED.sponsor_type,
        contact_name = EXCLUDED.contact_name,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        website_url = EXCLUDED.website_url,
        instagram_url = EXCLUDED.instagram_url,
        facebook_url = EXCLUDED.facebook_url,
        description = EXCLUDED.description,
        logo_url = EXCLUDED.logo_url,
        updated_at = NOW()
      `, [
            event_id,
            sponsor?.sponsorName || null,
            sponsor?.sponsorType || null,
            sponsor?.contactName || null,
            sponsor?.contactEmail || null,
            sponsor?.contactPhone || null,
            sponsor?.website || null,
            sponsor?.instagram || null,
            sponsor?.facebook || null,
            sponsor?.description || null,
            sponsor?.logoUrl || sponsor?.logo_url || null,
        ]);
        const orgUuid = req.params.orgUuid || req.body.org_uuid;
        const ownerUserId = req?.user?.id || null;
        if (!orgUuid) {
            return res.status(400).json({
                error: "orgUuid is required for organization event submission",
            });
        }
        console.log("ORG ATTACH DEBUG:", {
            event_id,
            paramsOrgUuid: req.params.orgUuid,
            bodyOrgUuid: req.body.org_uuid,
            ownerUserId,
        });
        await db_1.db.query(`
      UPDATE event_submissions
      SET
        org_uuid = $2,
        owner_user_id = COALESCE($3::uuid, owner_user_id),
        updated_at = NOW()
      WHERE id = $1
      `, [event_id, orgUuid, ownerUserId]);
        const existingVerification = await db_1.db.query(`
      SELECT id, otp_code
      FROM event_verifications
      WHERE event_id = $1
      LIMIT 1
      `, [event_id]);
        let verification = null;
        if (existingVerification.rows.length === 0) {
            verification = await (0, eventVerification_service_1.createEventVerification)(event_id);
        }
        else {
            console.log("EVENT VERIFICATION ALREADY EXISTS:", {
                event_id,
                verification_id: existingVerification.rows[0].id,
            });
            verification = {
                otp: existingVerification.rows[0].otp_code || null,
            };
        }
        return res.json({
            success: true,
            message: "Event details saved.",
            event_id,
            verification_required: true,
            dev_otp: verification?.otp || null,
        });
    }
    catch (error) {
        console.error("submitEventForReview error:", error);
        const message = error instanceof Error ? error.message : "Submission failed";
        return res.status(500).json({ error: message });
    }
}
