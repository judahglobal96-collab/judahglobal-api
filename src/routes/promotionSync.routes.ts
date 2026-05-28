import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/auth.middleware";
import {
  syncCampaignPromotionFlags,
  syncEventPromotionFlags,
} from "../services/promotionSync.service";

const router = Router();

router.post(
  "/campaign/:campaignId",
  requireAuth,
  requireRole("admin", "sysadmin", "execsysadmin"),
  async (req: Request, res: Response) => {
    try {
    
        const campaignId = String(req.params.campaignId);

      const result = await syncCampaignPromotionFlags(campaignId);

      return res.status(200).json({
        success: true,
        message: "Campaign promotion flags synced successfully.",
        result,
      });
    } catch (error) {
      console.error("sync campaign promotion flags error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to sync campaign promotion flags.",
      });
    }
  }
);

router.post(
  "/event/:eventId",
  requireAuth,
  requireRole("admin", "sysadmin", "execsysadmin"),
  async (req: Request, res: Response) => {
    try {
        const eventId = String(req.params.eventId);
        
      const result = await syncEventPromotionFlags(eventId);

      return res.status(200).json({
        success: true,
        message: "Event promotion flags synced successfully.",
        result,
      });
    } catch (error) {
      console.error("sync event promotion flags error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to sync event promotion flags.",
      });
    }
  }
);

export default router;