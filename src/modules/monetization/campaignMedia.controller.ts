import type { Request, Response } from "express";
import {
  createPendingCampaignMedia,
  getPendingCampaignMedia,
  getApprovedCampaignMedia,
  approveCampaignMediaReplacement,
  getRejectedCampaignMedia,
  rejectCampaignMediaReplacement,
  getCurrentLiveCampaignMedia,
  getCampaignMediaHistory,
  getLiveCampaignMedia,
} from "./campaignMedia.service";

export async function createCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const {
      campaignId,
      promoPurchaseId,
      eventId,
      placementType,
      mediaSlot,
      fileUrl,
      thumbnailUrl,
      fileSizeMB,
      mimeType,
      width,
      height,
      replacesMediaId,
    } = req.body;

    const uploadedBy =
      (req as any).user?.id ||
      (req as any).userId ||
      req.body.uploadedBy;

    if (!uploadedBy) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const result = await createPendingCampaignMedia({
      campaignId: campaignId ?? null,
      promoPurchaseId: promoPurchaseId ?? null,
      eventId: eventId ?? null,
      placementType,
      mediaSlot,
      fileUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      fileSizeMB: Number(fileSizeMB),
      mimeType,
      width: Number(width),
      height: Number(height),
      uploadedBy,
      replacesMediaId: replacesMediaId ?? null,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error: any) {
    console.error("createCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create campaign media.",
    });
  }
}
export async function getPendingCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const media = await getPendingCampaignMedia();

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("getPendingCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export async function getApprovedCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const media = await getApprovedCampaignMedia();

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("getApprovedCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export async function getRejectedCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const media = await getRejectedCampaignMedia();

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("getRejectedCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export async function approveCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const { replacementMediaId, currentMediaId } = req.body;

    console.log("APPROVE REQ USER:", (req as any).user);
    console.log("APPROVE REQ BODY:", req.body);

    const adminUserId =
      (req as any).user?.id ||
      (req as any).user?.sub ||
      (req as any).userId ||
      req.body.adminUserId;

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    if (!replacementMediaId) {
      return res.status(400).json({
        success: false,
        message: "replacementMediaId is required.",
      });
    }

    const result = await approveCampaignMediaReplacement({
      replacementMediaId,
      currentMediaId: currentMediaId ?? null,
      adminUserId,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("approveCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to approve campaign media.",
    });
  }
}

export async function rejectCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const { replacementMediaId, rejectionReason } = req.body;

    const adminUserId =
      (req as any).user?.id ||
      (req as any).user?.sub ||
      (req as any).userId ||
      req.body.adminUserId;

    if (!adminUserId) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    if (!replacementMediaId) {
      return res.status(400).json({
        success: false,
        message: "replacementMediaId is required.",
      });
    }

    const result = await rejectCampaignMediaReplacement({
      replacementMediaId,
      adminUserId,
      rejectionReason,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("rejectCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to reject campaign media.",
    });
  }
}
    export async function getCampaignMediaHistoryController(
  req: Request,
  res: Response
) {
  try {
    const media = await getCampaignMediaHistory({
      placementType: req.query.placementType
        ? String(req.query.placementType)
        : undefined,
      mediaSlot: req.query.mediaSlot ? String(req.query.mediaSlot) : undefined,
      eventId: req.query.eventId ? String(req.query.eventId) : undefined,
      promoPurchaseId: req.query.promoPurchaseId
        ? String(req.query.promoPurchaseId)
        : undefined,
      campaignId: req.query.campaignId ? String(req.query.campaignId) : undefined,
    });

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("getCampaignMediaHistoryController error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}
export async function getLiveCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const media = await getLiveCampaignMedia();

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error) {
    console.error("getLiveCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

export async function getCurrentLiveCampaignMediaController(
  req: Request,
  res: Response
) {
  try {
    const {
      campaignId,
      promoPurchaseId,
      eventId,
      placementType,
      mediaSlot,
    } = req.query;

    if (!placementType || !mediaSlot) {
      return res.status(400).json({
        success: false,
        message: "placementType and mediaSlot are required.",
      });
    }

    const media = await getCurrentLiveCampaignMedia({
      campaignId: campaignId ? String(campaignId) : undefined,
      promoPurchaseId: promoPurchaseId ? String(promoPurchaseId) : undefined,
      eventId: eventId ? String(eventId) : undefined,
      placementType: String(placementType),
      mediaSlot: String(mediaSlot),
    });

    return res.status(200).json({
      success: true,
      media,
    });
  } catch (error: any) {
    console.error("getCurrentLiveCampaignMediaController error:", error);

    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to load campaign media.",
    });
  }
}