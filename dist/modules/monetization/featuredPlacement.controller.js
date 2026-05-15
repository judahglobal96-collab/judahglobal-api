"use strict";
// LEGACY FEATURED PLACEMENT MODULE
// Retained temporarily for backward compatibility.
// New monetization flow should use campaign.* modules.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableFeaturedPlacementsController = getAvailableFeaturedPlacementsController;
exports.reserveFeaturedPlacementController = reserveFeaturedPlacementController;
exports.getCampaignAvailabilityController = getCampaignAvailabilityController;
exports.autoAssignAndReserveCampaignController = autoAssignAndReserveCampaignController;
const db_1 = require("../../config/db");
const featuredPlacement_model_1 = require("./featuredPlacement.model");
function getAuthenticatedUserId(req) {
    const user = req.user;
    return user?.id || null;
}
async function getEventOwnership(eventId) {
    const result = await db_1.db.query(`
    SELECT id, owner_user_id, event_code, status, payment_status
    FROM event_submissions
    WHERE id = $1
    LIMIT 1
    `, [eventId]);
    return result.rows[0] ?? null;
}
async function getAvailableFeaturedPlacementsController(req, res) {
    try {
        const pageName = typeof req.query.page_name === "string" ? req.query.page_name : undefined;
        const rows = await (0, featuredPlacement_model_1.getAvailableFeaturedPlacements)(pageName);
        return res.status(200).json({
            success: true,
            count: rows.length,
            placements: rows,
        });
    }
    catch (error) {
        console.error("getAvailableFeaturedPlacementsController error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to load available featured placements.",
        });
    }
}
async function reserveFeaturedPlacementController(req, res) {
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
        const inventory = await (0, featuredPlacement_model_1.getFeaturedPlacementInventoryById)(String(inventoryId));
        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Featured placement slot not found.",
            });
        }
        const available = await (0, featuredPlacement_model_1.isPlacementInventoryAvailable)(String(inventoryId));
        if (!available) {
            return res.status(409).json({
                success: false,
                message: "That premium placement slot is no longer available.",
            });
        }
        const reservation = await (0, featuredPlacement_model_1.reserveFeaturedPlacement)({
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
    }
    catch (error) {
        console.error("reserveFeaturedPlacementController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to reserve featured placement.",
        });
    }
}
async function getCampaignAvailabilityController(req, res) {
    try {
        const promoType = typeof req.query.promo_type === "string" ? req.query.promo_type : "";
        const startDate = typeof req.query.start_date === "string" ? req.query.start_date : "";
        const durationDaysRaw = typeof req.query.duration_days === "string"
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
        const availability = await (0, featuredPlacement_model_1.getCampaignAvailability)({
            promoType: promoType,
            startDate,
            durationDays: durationDays,
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
    }
    catch (error) {
        console.error("getCampaignAvailabilityController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to load campaign availability.",
        });
    }
}
async function autoAssignAndReserveCampaignController(req, res) {
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
        const reservation = await (0, featuredPlacement_model_1.autoAssignAndReserveCampaign)({
            eventId: String(eventId),
            promoType: String(promoType),
            startDate: String(startDate),
            durationDays: Number(durationDays),
        });
        const reservations = await (0, featuredPlacement_model_1.getExistingPlacementReservationForEvent)(String(eventId));
        return res.status(200).json({
            success: true,
            alreadyReserved: reservation.alreadyReserved,
            message: reservation.alreadyReserved
                ? "Campaign placement was already reserved."
                : "Campaign placement reserved successfully.",
            reservation,
            reservations,
        });
    }
    catch (error) {
        console.error("autoAssignAndReserveCampaignController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to auto-assign and reserve campaign placement.",
        });
    }
}
