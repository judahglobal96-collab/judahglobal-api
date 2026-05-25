import type { Request, Response } from "express";
import { db } from "../config/db";

function buildVenueAddress(row: any) {
  return [
    row.address_line1,
    row.address_line2,
    row.city,
    row.state_region,
    row.postal_code,
    row.country,
  ]
    .filter(Boolean)
    .join(", ");
}

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
        e.id,
        e.slug,
        e.event_code,
        e.title,
        e.short_description,
        e.description,
        e.category,
        e.status,
        e.featured,

        s.event_type,
        s.start_date,
        s.end_date,
        s.start_time,
        s.end_time,
        s.timezone AS schedule_timezone,
        s.is_recurring,
        s.recurrence_rule,

        l.venue_name,
        l.address_line1,
        l.address_line2,
        l.city,
        l.state_region,
        l.postal_code,
        l.country,
        l.location_type,
        l.location_details,
        l.latitude,
        l.longitude,

        sp.sponsor_type,
        sp.sponsor_name,
        sp.contact_email,
        sp.contact_phone,
        sp.website_url,
        sp.logo_url AS sponsor_logo_url,

        ev.email AS submitter_email,

        edi.starts_at_utc,
        edi.ends_at_utc,
        edi.starts_at_local,
        edi.ends_at_local,
        edi.schedule_timezone AS discovery_timezone,

        em.file_url AS media_url,
        em.moderation_status AS media_status,
        em.is_primary AS media_primary,

        ofm.file_url AS official_flyer_url

      FROM events e

      LEFT JOIN event_schedules s
        ON s.event_id = e.id

      LEFT JOIN event_locations l
        ON l.event_id = e.id

      LEFT JOIN event_sponsors sp
        ON sp.event_id = e.id

      LEFT JOIN event_email_verifications ev
        ON ev.event_id = e.id

      LEFT JOIN event_discovery_index edi
        ON edi.event_id = e.id

      LEFT JOIN LATERAL (
        SELECT em2.file_url, em2.moderation_status, em2.is_primary
        FROM event_media em2
        WHERE em2.event_id = e.id
          AND em2.moderation_status = 'approved'
          AND em2.is_primary = true
        ORDER BY em2.created_at DESC
        LIMIT 1
      ) em ON true

      LEFT JOIN LATERAL (
        SELECT cm.file_url
        FROM campaign_media cm
        WHERE cm.event_id = e.id
          AND cm.placement_type = 'official_flyer'
          AND cm.moderation_status = 'approved'
          AND cm.lifecycle_status = 'active'
          AND cm.deployment_status = 'live'
          AND cm.is_current_live = true
        ORDER BY cm.approved_at DESC NULLS LAST, cm.created_at DESC
        LIMIT 1
      ) ofm ON true

      WHERE e.status = 'approved'
        AND (
          e.id::text = $1
          OR e.slug = $1
          OR e.event_code = $1
        )
        AND (
          e.expires_at IS NULL
          OR e.expires_at > NOW()
        )
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
    const venueAddress = buildVenueAddress(event);
    const isVirtual = event.location_type === "virtual";

    return res.status(200).json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        eventCode: event.event_code,

        title: event.title,
        shortDescription: event.short_description,
        description: event.description,
        category: event.category,
        status: event.status,

        featured: Boolean(event.featured),
        isFeatured: Boolean(event.featured),

        fileUrl: event.media_url || null,
        mediaUrl: event.media_url || null,
        mediaStatus: event.media_status || null,

        officialFlyerUrl: event.official_flyer_url || null,
        official_flyer_url: event.official_flyer_url || null,

        venueName: event.venue_name || null,
        venueAddress: venueAddress || null,

        sponsorName: event.sponsor_name || null,
        contactEmail: event.contact_email || null,
        country: event.country || null,
        isVirtual,

        schedule: {
          eventType: event.event_type,
          startDate: event.start_date,
          endDate: event.end_date,
          startTime: event.start_time,
          endTime: event.end_time,
          timezone: event.schedule_timezone || event.discovery_timezone,
          isRecurring: event.is_recurring,
          recurrenceRule: event.recurrence_rule,
          startsAtUtc: event.starts_at_utc,
          endsAtUtc: event.ends_at_utc,
          startsAtLocal: event.starts_at_local,
          endsAtLocal: event.ends_at_local,
        },

        location: {
          venueName: event.venue_name || null,
          venueAddress: venueAddress || null,
          addressLine1: event.address_line1 || null,
          addressLine2: event.address_line2 || null,
          city: event.city || null,
          stateRegion: event.state_region || null,
          postalCode: event.postal_code || null,
          country: event.country || null,
          locationType: event.location_type || null,
          locationDetails: event.location_details || null,
          latitude: event.latitude || null,
          longitude: event.longitude || null,
          isVirtual,
        },

        sponsor: {
          sponsorType: event.sponsor_type || null,
          sponsorName: event.sponsor_name || null,
          contactEmail: event.contact_email || null,
          contactPhone: event.contact_phone || null,
          websiteUrl: event.website_url || null,
          logoUrl: event.sponsor_logo_url || null,
        },

        submitterEmail: event.submitter_email || null,
      },
    });
  } catch (error) {
    console.error("getPublicEventBySlug error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load event",
    });
  }
}