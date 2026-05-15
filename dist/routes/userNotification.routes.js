"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sendUserEventNotifications_1 = require("../lib/sendUserEventNotifications");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * TEST TRIGGER
 * POST /api/user-notifications/test-send
 *
 * This will manually trigger the notification system
 */
router.post("/test-send", auth_middleware_1.requireAuth, async (req, res) => {
    try {
        const result = await (0, sendUserEventNotifications_1.sendUserEventNotifications)();
        return res.status(200).json({
            message: "User event notifications triggered successfully",
            result,
        });
    }
    catch (error) {
        console.error("Test notification send failed:", error);
        return res.status(500).json({
            message: "Failed to trigger notifications",
        });
    }
});
exports.default = router;
