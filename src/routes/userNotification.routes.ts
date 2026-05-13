import { Router, Request, Response } from "express";
import { sendUserEventNotifications } from "../lib/sendUserEventNotifications";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/**
 * TEST TRIGGER
 * POST /api/user-notifications/test-send
 *
 * This will manually trigger the notification system
 */
router.post(
  "/test-send",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const result = await sendUserEventNotifications();

      return res.status(200).json({
        message: "User event notifications triggered successfully",
        result,
      });
    } catch (error) {
      console.error("Test notification send failed:", error);

      return res.status(500).json({
        message: "Failed to trigger notifications",
      });
    }
  }
);

export default router;