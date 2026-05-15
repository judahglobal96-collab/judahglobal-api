"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requireRole_1 = require("../middleware/requireRole");
const promotionSync_service_1 = require("../services/promotionSync.service");
const router = (0, express_1.Router)();
router.post("/campaign/:campaignId", auth_middleware_1.requireAuth, (0, requireRole_1.requireRole)("admin", "sysadmin", "execsysadmin"), async (req, res) => {
    try {
        const campaignId = String(req.params.campaignId);
        const result = await (0, promotionSync_service_1.syncCampaignPromotionFlags)(campaignId);
        return res.status(200).json({
            success: true,
            message: "Campaign promotion flags synced successfully.",
            result,
        });
    }
    catch (error) {
        console.error("sync campaign promotion flags error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to sync campaign promotion flags.",
        });
    }
});
router.post("/event/:eventId", auth_middleware_1.requireAuth, (0, requireRole_1.requireRole)("admin", "sysadmin", "execsysadmin"), async (req, res) => {
    try {
        const eventId = String(req.params.eventId);
        const result = await (0, promotionSync_service_1.syncEventPromotionFlags)(eventId);
        return res.status(200).json({
            success: true,
            message: "Event promotion flags synced successfully.",
            result,
        });
    }
    catch (error) {
        console.error("sync event promotion flags error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to sync event promotion flags.",
        });
    }
});
exports.default = router;
