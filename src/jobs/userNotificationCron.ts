import cron from "node-cron";
import { sendUserEventNotifications } from "../lib/sendUserEventNotifications";

let isRunning = false;

export function startUserNotificationCron() {
  cron.schedule(
    "0 18 * * 3,6", // Wednesday (3) & Saturday (6) at 6:00 PM
    async () => {
      if (isRunning) {
        console.log("[UserNotificationCron] Already running. Skipping...");
        return;
      }

      isRunning = true;

      try {
        console.log("[UserNotificationCron] Starting email notifications...");

        const result = await sendUserEventNotifications();

        console.log("[UserNotificationCron] Completed:", result);
      } catch (error) {
        console.error("[UserNotificationCron] Failed:", error);
      } finally {
        isRunning = false;
      }
    },
    {
      timezone:
        process.env.NOTIFICATION_CRON_TIMEZONE || "America/New_York",
    }
  );

  console.log(
    "[UserNotificationCron] Scheduled: Wed & Sat @ 6:00 PM (America/New_York)"
  );
}