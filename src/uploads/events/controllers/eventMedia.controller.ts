import type { Request, Response } from "express";
import { db } from "../../../config/db";

export async function uploadEventMediaController(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const uploadType = String(req.body.upload_type || "event_media").toLowerCase();
    const eventId = req.body.event_id || req.params.eventId || null;
    const campaignItemId = req.body.campaign_item_id || req.body.campaignItemId || null;

    if (uploadType === "campaign_promo" && !campaignItemId) {
      return res.status(400).json({
        success: false,
        message: "campaign_item_id is required for campaign promo uploads.",
      });
    }

    if (uploadType !== "campaign_promo" && !eventId) {
      return res.status(400).json({
        success: false,
        message: "event_id is required.",
      });
    }

    let fileUrl = `/uploads/events/${req.file.filename}`;

    if (uploadType === "sponsor_logo") {
      fileUrl = `/uploads/sponsors/${req.file.filename}`;
    }

    if (uploadType === "campaign_promo") {
      fileUrl = `/uploads/campaigns/${req.file.filename}`;
    }

    console.log("UPLOAD SUCCESS", {
      uploadType,
      eventId,
      campaignItemId,
      fileUrl,
    });

    // CASE 1: Sponsor Logo -> update sponsor table
    if (uploadType === "sponsor_logo") {
      const existingSponsor = await db.query(
        `
        SELECT id
        FROM event_sponsors
        WHERE event_id = $1
        LIMIT 1
        `,
        [eventId]
      );

      if (existingSponsor.rows.length > 0) {
        const sponsorResult = await db.query(
          `
          UPDATE event_sponsors
          SET logo_url = $2,
              updated_at = NOW()
          WHERE event_id = $1
          RETURNING *
          `,
          [eventId, fileUrl]
        );

        console.log("SPONSOR LOGO UPDATED", sponsorResult.rows[0]);

        return res.status(200).json({
          success: true,
          type: "sponsor_logo",
          url: fileUrl,
          sponsor: sponsorResult.rows[0],
        });
      }

      return res.status(200).json({
        success: true,
        type: "sponsor_logo",
        url: fileUrl,
        sponsor: null,
      });
    }

    // CASE 2: Campaign Promo Media -> insert into campaign_promo_media
    if (uploadType === "campaign_promo") {
      const result = await db.query(
        `
        INSERT INTO campaign_promo_media (
          campaign_item_id,
          file_url,
          moderation_status,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          'pending',
          true,
          NOW(),
          NOW()
        )
        RETURNING *
        `,
        [campaignItemId, fileUrl]
      );

      console.log("CAMPAIGN PROMO MEDIA INSERTED", result.rows[0]);

      return res.status(200).json({
        success: true,
        type: "campaign_promo",
        url: fileUrl,
        media: result.rows[0],
      });
    }

    // CASE 3: Event Media -> insert into event_media
    const result = await db.query(
      `
      INSERT INTO event_media (
        event_id,
        media_type,
        file_url,
        file_name,
        mime_type,
        file_size_bytes,
        is_primary,
        moderation_status,
        moderation_reason,
        moderation_reviewed_at,
        moderation_reviewed_by,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        'pending',
        NULL,
        NULL,
        NULL,
        NOW(),
        NOW()
      )
      RETURNING *
      `,
      [
        eventId,
        "image",
        fileUrl,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        true,
      ]
    );

    console.log("EVENT MEDIA INSERTED", result.rows[0]);

    return res.status(200).json({
      success: true,
      type: "event_media",
      url: fileUrl,
      media: result.rows[0],
    });
  } catch (error) {
    console.error("UPLOAD_EVENT_MEDIA_ERROR", error);

    return res.status(500).json({
      success: false,
      message: "Upload failed.",
    });
  }
}