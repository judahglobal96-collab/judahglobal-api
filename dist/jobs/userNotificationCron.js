"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startUserNotificationCron = startUserNotificationCron;
const node_cron_1 = __importDefault(require("node-cron"));
const sendUserEventNotifications_1 = require("../lib/sendUserEventNotifications");
let isRunning = false;
function startUserNotificationCron() {
    node_cron_1.default.schedule("0 18 * * 3,6", // Wednesday (3) & Saturday (6) at 6:00 PM
    async () => {
        if (isRunning) {
            console.log("[UserNotificationCron] Already running. Skipping...");
            return;
        }
        isRunning = true;
        try {
            console.log("[UserNotificationCron] Starting email notifications...");
            const result = await (0, sendUserEventNotifications_1.sendUserEventNotifications)();
            console.log("[UserNotificationCron] Completed:", result);
        }
        catch (error) {
            console.error("[UserNotificationCron] Failed:", error);
        }
        finally {
            isRunning = false;
        }
    }, {
        timezone: process.env.NOTIFICATION_CRON_TIMEZONE || "America/New_York",
    });
    console.log("[UserNotificationCron] Scheduled: Wed & Sat @ 6:00 PM (America/New_York)");
}
