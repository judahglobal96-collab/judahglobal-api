// LEGACY FEATURED PLACEMENT MODULE
// Retained temporarily for backward compatibility.
// New monetization flow should use campaign.* modules.

import { Request, Response } from "express";
import { db } from "../../config/db";
import {
  autoAssignAndReserveCampaign,
  getAvailableFeaturedPlacements,
  getCampaignAvailability,
  getExistingPlacementReservationForEvent,
  getFeaturedPlacementInventoryById,
  isPlacementInventoryAvailable,
  reserveFeaturedPlacement,
} from "./featuredPlacement.model";

function getAuthenticatedUserId(req: Request): string | null {
  const user = (req as any).user;
  return user?.id || null;
}

async function getEventOwnership(eventId: string) {
  const result = await db.query(
    `
    SELECT id, owner_user_id, event_code, status, payment_status
    FROM event_submissions
    WHERE id = $1
    LIMIT 1
    `,
    [eventId]
  );

  return result.rows[0] ?? null;
}

export async function getAvailableFeaturedPlacementsController(
  req: Request,
  res: Response
) {
  try {
    const pageName =
      typeof req.query.page_name === "string" ? req.query.page_name : undefined;

    const rows = await getAvailableFeaturedPlacements(pageName);

    return res.status(200).json({
      success: true,
      count: rows.length,
      placements: rows,
    });
  } catch (error) {
    console.error("getAvailableFeaturedPlacementsController error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load available featured placements.",
    });
  }
}

export async function reserveFeaturedPlacementController(
  req: Request,
  res: Response
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { eventId, inventoryId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!eventId || !inventoryId) {
      return res.status(400).json({
        success: false,
        message: "eventId and inventoryId are required.",
      });
    }

    const event = await getEventOwnership(String(eventId));

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.owner_user_id && event.owner_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this event.",
      });
    }

    if (event.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft events can reserve premium placement.",
      });
    }

    const inventory = await getFeaturedPlacementInventoryById(String(inventoryId));

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Featured placement slot not found.",
      });
    }

    const available = await isPlacementInventoryAvailable(String(inventoryId));

    if (!available) {
      return res.status(409).json({
        success: false,
        message: "That premium placement slot is no longer available.",
      });
    }

    const reservation = await reserveFeaturedPlacement({
      eventId: String(eventId),
      inventoryId: String(inventoryId),
    });

    return res.status(200).json({
      success: true,
      message: reservation.alreadyReserved
        ? "Featured placement already reserved for this event."
        : "Featured placement reserved successfully.",
      reservation,
    });
  } catch (error: any) {
    console.error("reserveFeaturedPlacementController error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to reserve featured placement.",
    });
  }
}

export async function getCampaignAvailabilityController(
  req: Request,
  res: Response
) {
  try {
    const promoType =
      typeof req.query.promo_type === "string" ? req.query.promo_type : "";
    const startDate =
      typeof req.query.start_date === "string" ? req.query.start_date : "";
    const durationDaysRaw =
      typeof req.query.duration_days === "string"
        ? req.query.duration_days
        : "7";

    const durationDays = Number(durationDaysRaw);

    if (!promoType || !["homepage", "discovery", "hero"].includes(promoType)) {
      return res.status(400).json({
        success: false,
        message: "promo_type must be homepage, discovery, or hero.",
      });
    }

    if (!startDate) {
      return res.status(400).json({
        success: false,
        message: "start_date is required.",
      });
    }

    if (![7, 10].includes(durationDays)) {
      return res.status(400).json({
        success: false,
        message: "duration_days must be 7 or 10.",
      });
    }

    const availability = await getCampaignAvailability({
      promoType: promoType as "homepage" | "discovery" | "hero",
      startDate,
      durationDays: durationDays as 7 | 10,
    });

    return res.status(200).json({
      success: true,
      available: availability.available,
      available_count: availability.count,
      starts_at_utc: availability.startsAtUtc,
      ends_at_utc: availability.endsAtUtc,
      page_name: availability.pageName,
      placement_type: availability.placementType,
      placements: availability.placements,
    });
  } catch (error: any) {
    console.error("getCampaignAvailabilityController error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to load campaign availability.",
    });
  }
}

export async function autoAssignAndReserveCampaignController(
  req: Request,
  res: Response
) {
  try {
    const userId = getAuthenticatedUserId(req);
    const { eventId, promoType, startDate, durationDays } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (!eventId || !promoType || !startDate || !durationDays) {
      return res.status(400).json({
        success: false,
        message: "eventId, promoType, startDate, and durationDays are required.",
      });
    }

    if (!["homepage", "discovery", "hero"].includes(String(promoType))) {
      return res.status(400).json({
        success: false,
        message: "promoType must be homepage, discovery, or hero.",
      });
    }

    if (![7, 10].includes(Number(durationDays))) {
      return res.status(400).json({
        success: false,
        message: "durationDays must be 7 or 10.",
      });
    }

    const event = await getEventOwnership(String(eventId));

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (event.owner_user_id && event.owner_user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this event.",
      });
    }

    if (event.status !== "draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft events can reserve campaign placement.",
      });
    }

    const reservation = await autoAssignAndReserveCampaign({
      eventId: String(eventId),
      promoType: String(promoType) as "homepage" | "discovery" | "hero",
      startDate: String(startDate),
      durationDays: Number(durationDays) as 7 | 10,
    });

    const reservations = await getExistingPlacementReservationForEvent(String(eventId));

    return res.status(200).json({
      success: true,
      alreadyReserved: reservation.alreadyReserved,
      message: reservation.alreadyReserved
        ? "Campaign placement was already reserved."
        : "Campaign placement reserved successfully.",
      reservation,
      reservations,
    });
  } catch (error: any) {
    console.error("autoAssignAndReserveCampaignController error:", error);

    return res.status(500).json({
      success: false,
      message:
        error?.message || "Failed to auto-assign and reserve campaign placement.",
    });
  }
}