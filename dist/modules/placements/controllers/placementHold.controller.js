"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlacementHoldSessionController = createPlacementHoldSessionController;
exports.getPlacementHoldSessionController = getPlacementHoldSessionController;
exports.releasePlacementHoldSessionController = releasePlacementHoldSessionController;
const placementHold_service_1 = require("../services/placementHold.service");
function getAuthenticatedUserId(req) {
    const user = req.user;
    return user?.id || null;
}
async function createPlacementHoldSessionController(req, res) {
    try {
        const userId = getAuthenticatedUserId(req);
        const { eventId, orgId, windows } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized.",
            });
        }
        if (!Array.isArray(windows) || windows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one placement window is required.",
            });
        }
        const result = await (0, placementHold_service_1.createPlacementHoldSession)({
            eventId: eventId ? String(eventId) : null,
            orgId: orgId ? String(orgId) : null,
            userId: String(userId),
            windows,
        });
        return res.status(201).json({
            success: true,
            message: "Placement hold created successfully.",
            hold: result,
        });
    }
    catch (error) {
        console.error("createPlacementHoldSessionController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to create placement hold session.",
        });
    }
}
async function getPlacementHoldSessionController(req, res) {
    try {
        const { holdSessionId } = req.params;
        if (!holdSessionId) {
            return res.status(400).json({
                success: false,
                message: "holdSessionId is required.",
            });
        }
        const result = await (0, placementHold_service_1.getPlacementHoldSession)(String(holdSessionId));
        return res.status(200).json({
            success: true,
            hold: result,
        });
    }
    catch (error) {
        console.error("getPlacementHoldSessionController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to load placement hold session.",
        });
    }
}
async function releasePlacementHoldSessionController(req, res) {
    try {
        const { holdSessionId } = req.params;
        if (!holdSessionId) {
            return res.status(400).json({
                success: false,
                message: "holdSessionId is required.",
            });
        }
        const result = await (0, placementHold_service_1.releasePlacementHoldSession)(String(holdSessionId));
        return res.status(200).json({
            success: true,
            message: "Placement hold released successfully.",
            hold: result,
        });
    }
    catch (error) {
        console.error("releasePlacementHoldSessionController error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message || "Failed to release placement hold session.",
        });
    }
}
