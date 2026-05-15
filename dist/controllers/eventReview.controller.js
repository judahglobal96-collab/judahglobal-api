"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventReview = getEventReview;
const db_1 = require("../config/db");
const weekdayLabels = {
    SU: "Sunday",
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
};
function formatWeekly(days) {
    return days.map((d) => weekdayLabels[d] || d).join(", ");
}
function formatMonthlyWeek(week) {
    if (week === -1)
        return "Last";
    if (week === 1)
        return "First";
    if (week === 2)
        return "Second";
    if (week === 3)
        return "Third";
    if (week === 4)
        return "Fourth";
    if (week === 5)
        return "Fifth";
    return "";
}
function buildRecurrenceSummary(schedule) {
    if (!schedule)
        return null;
    if (schedule.schedule_type === "one_time") {
        return "One-time event";
    }
    if (schedule.schedule_type === "recurring_weekly") {
        const days = Array.isArray(schedule.recurrence_days)
            ? schedule.recurrence_days
            : [];
        const every = schedule.recurrence_interval || 1;
        const until = schedule.recurrence_until
            ? ` until ${schedule.recurrence_until}`
            : "";
        return `Repeats every ${every} week(s) on ${formatWeekly(days)}${until}`;
    }
    if (schedule.schedule_type === "recurring_monthly") {
        const every = schedule.recurrence_interval || 1;
        const until = schedule.recurrence_until
            ? ` until ${schedule.recurrence_until}`
            : "";
        if (schedule.monthly_mode === "day_of_month") {
            return `Repeats every ${every} month(s) on day ${schedule.monthly_day}${until}`;
        }
        if (schedule.monthly_mode === "nth_weekday") {
            return `Repeats every ${every} month(s) on ${formatMonthlyWeek(schedule.monthly_week)} ${weekdayLabels[schedule.monthly_weekday]}${until}`;
        }
        return `Repeats every ${every} month(s)${until}`;
    }
    return null;
}
async function getEventReview(req, res) {
    const eventId = req.params.eventId;
    if (!eventId) {
        return res.status(400).json({ error: "Event ID is required." });
    }
    try {
        const result = await db_1.db.query(`
      SELECT
        e.id AS event_id,
        e.title,
        e.event_type,
        e.short_description,
        e.description,

        s.schedule_type,
        s.start_date,
        s.start_time,
        s.end_date,
        s.end_time,
        COALESCE(s.schedule_timezone, s.timezone) AS schedule_timezone,
        s.recurrence_interval,
        s.recurrence_days,
        s.monthly_mode,
        s.monthly_day,
        s.monthly_week,
        s.monthly_weekday,
        s.recurrence_until,
        s.recurrence_rule,

        l.venue_name,
        l.address_line_1,
        l.address_line_2,
        l.city,
        l.state_region,
        l.postal_code,
        l.country,
        l.is_virtual,

        sp.sponsor_name,
        sp.sponsor_type,
        sp.contact_name,
        sp.contact_email,
        sp.contact_phone,
        sp.website_url,
        sp.logo_url

      FROM event_submissions e
      LEFT JOIN event_schedules s
        ON s.event_id = e.id
      LEFT JOIN event_locations l
        ON l.event_id = e.id
      LEFT JOIN event_sponsors sp
        ON sp.event_id = e.id
      WHERE e.id = $1
      `, [eventId]);
        if (!result.rows.length) {
            return res.status(404).json({ error: "Event not found." });
        }
        const row = result.rows[0];
        const schedule = row.schedule_type
            ? {
                schedule_type: row.schedule_type,
                start_date: row.start_date,
                start_time: row.start_time,
                end_date: row.end_date,
                end_time: row.end_time,
                schedule_timezone: row.schedule_timezone,
                recurrence_interval: row.recurrence_interval,
                recurrence_days: row.recurrence_days || [],
                monthly_mode: row.monthly_mode,
                monthly_day: row.monthly_day,
                monthly_week: row.monthly_week,
                monthly_weekday: row.monthly_weekday,
                recurrence_until: row.recurrence_until,
                recurrence_rule: row.recurrence_rule,
            }
            : null;
        const location = row.venue_name ||
            row.address_line_1 ||
            row.city ||
            row.state_region ||
            row.country
            ? {
                venueName: row.venue_name,
                address1: row.address_line_1,
                address2: row.address_line_2,
                city: row.city,
                stateRegion: row.state_region,
                postalCode: row.postal_code,
                country: row.country,
                isVirtual: row.is_virtual,
            }
            : null;
        const sponsor = row.sponsor_name ||
            row.contact_name ||
            row.contact_email ||
            row.website
            ? {
                sponsorName: row.sponsor_name,
                sponsorType: row.sponsor_type,
                contactName: row.contact_name,
                sponsorEmail: row.contact_email,
                sponsorPhone: row.contact_phone,
                sponsorWebsite: row.website_url,
                imageUrl: row.logo_url,
            }
            : null;
        return res.status(200).json({
            event_id: row.event_id,
            title: row.title,
            event_type: row.event_type,
            short_description: row.short_description,
            description: row.description,
            basics: {
                title: row.title,
                shortDescription: row.short_description,
                category: row.event_type,
            },
            schedule,
            schedule_summary: buildRecurrenceSummary(schedule),
            location,
            sponsor,
        });
    }
    catch (error) {
        console.error("getEventReview error:", error);
        return res.status(500).json({ error: "Unable to load review right now." });
    }
}
