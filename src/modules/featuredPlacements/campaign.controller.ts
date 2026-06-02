import { Request, Response } from "express";
import {
  checkCampaignAvailability,
  getCampaignCalendarAvailability,
  reserveCampaign,
  createCampaignReview,
  createCampaignCheckoutSession,
  uploadCampaignPromoMedia,
  getCampaignPromoMediaStatus,
  getCampaignPaymentSuccessBySessionId,
} from "./campaign.service";

import { createPendingCampaignMedia } from "../monetization/campaignMedia.service";

type PlacementType =
  | "hero"
  | "homepage_hero"
  | "homepage_top"
  | "homepage_top_row"
  | "discovery_top"
  | "discovery_top_row"
  | "featured_badge"
  | "major_events"
  | "official_flyer"
  | "event_fee"
  | "event_submission_fee";

type IncomingCampaignItem = {
  placementType: PlacementType;
  startDate: string;
  quantity: number;
  durationDays?: number | null;
  regionCode?: string | null;
};

type CheckAvailabilityItemsInput = Parameters<typeof checkCampaignAvailability>[0];
type CalendarAvailabilityInput = Parameters<typeof getCampaignCalendarAvailability>[0];
type ReserveCampaignInput = Parameters<typeof reserveCampaign>[0];
type ReserveCampaignItemsInput = ReserveCampaignInput["items"];
type UploadCampaignPromoMediaInput = Parameters<typeof uploadCampaignPromoMedia>[0];
type GetCampaignPromoMediaStatusInput = Parameters<typeof getCampaignPromoMediaStatus>[0];

function isValidPlacementType(value: unknown): value is PlacementType {
  return (
    value === "hero" ||
    value === "homepage_hero" ||
    value === "homepage_top" ||
    value === "homepage_top_row" ||
    value === "discovery_top" ||
    value === "discovery_top_row" ||
    value === "featured_badge" ||
    value === "major_events" ||
    value === "official_flyer" ||
    value === "event_fee" ||
    value === "event_submission_fee"
  );
}

function normalizePlacementType(value: PlacementType): string {
  if (value === "homepage_hero") return "hero";
  if (value === "homepage_top_row") return "homepage_top";
  if (value === "discovery_top_row") return "discovery_top";
  if (value === "event_submission_fee") return "event_fee";
  return value;
}

function getMediaSlot(placementType: PlacementType): string {
  const normalized = normalizePlacementType(placementType);

  if (normalized === "official_flyer") return "primary";
  if (normalized === "hero") return "desktop";
  if (normalized === "homepage_top") return "primary";
  if (normalized === "discovery_top") return "primary";
  if (normalized === "featured_badge") return "primary";
  if (normalized === "major_events") return "primary";
  
  return "primary";
}

function isDurationPlacement(placementType: PlacementType) {
  return placementType === "featured_badge" || placementType === "major_events";
}

function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function normalizeCampaignItems(items: unknown): ReserveCampaignItemsInput {
  if (!Array.isArray(items)) {
    throw new Error("Campaign items are required.");
  }

  if (items.length === 0) {
    throw new Error("At least one campaign item is required.");
  }

  return items.map((rawItem, index) => {
    const item = rawItem as Partial<IncomingCampaignItem>;

    if (!isValidPlacementType(item.placementType)) {
      throw new Error(`Item ${index + 1}: placementType is invalid.`);
    }

    if (!isValidDateString(item.startDate)) {
      throw new Error(
        `Item ${index + 1}: startDate is required and must be a valid date.`
      );
    }

    const quantity = Math.max(1, Number(item.quantity || 1));

    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error(`Item ${index + 1}: quantity must be at least 1.`);
    }

    const durationDays = isDurationPlacement(item.placementType)
      ? item.durationDays == null
        ? 21
        : Number(item.durationDays)
      : null;

    if (
      isDurationPlacement(item.placementType) &&
      (!Number.isFinite(durationDays) || (durationDays as number) < 1)
    ) {
      throw new Error(`Item ${index + 1}: durationDays must be at least 1.`);
    }

    return {
      placementType: normalizePlacementType(item.placementType) as any,
      placementDate: item.startDate,
      slotNumber: null,
      quantity,
      durationDays,
      regionCode: item.regionCode || null,
    };
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getValidationStatusCode(message: string) {
  return message.includes("required") || message.includes("invalid") ? 400 : 500;
}

function getUploadedFile(req: Request) {
  const singleFile = (req as any).file;
  if (singleFile) return singleFile;

  const files = (req as any).files;
  if (Array.isArray(files) && files.length > 0) return files[0];

  return null;
}

export async function checkCampaignAvailabilityController(
  req: Request,
  res: Response
) {
  try {
    const items: CheckAvailabilityItemsInput = normalizeCampaignItems(
      req.body?.items
    );

    const results = await checkCampaignAvailability(items);

    return res.status(200).json({
      message: "Availability checked successfully.",
      results,
    });
  } catch (error) {
    console.error("checkCampaignAvailabilityController error:", error);

    const message = getErrorMessage(
      error,
      "Unable to check campaign availability."
    );

    return res.status(getValidationStatusCode(message)).json({ message });
  }
}

export async function getCampaignCalendarAvailabilityController(
  req: Request,
  res: Response
) {
  try {
    const { placementType, startDate, weeks } = req.body;

    if (!isValidPlacementType(placementType)) {
      return res.status(400).json({
        message: "placementType is required and must be valid.",
      });
    }

    if (!isValidDateString(startDate)) {
      return res.status(400).json({
        message: "startDate is required and must be a valid date.",
      });
    }

    const normalizedWeeks = Math.max(1, Math.min(52, Number(weeks || 12)));

    if (!Number.isFinite(normalizedWeeks)) {
      return res.status(400).json({
        message: "weeks must be a valid number.",
      });
    }

    const payload: CalendarAvailabilityInput = {
      placementType: normalizePlacementType(placementType) as any,
      startDate,
      weeks: normalizedWeeks,
      regionCode: req.body.regionCode || req.body.region || "USA",
      eventId: req.body.eventId || null,
    };

    const result = await getCampaignCalendarAvailability(payload);

    return res.status(200).json({
      message: "Calendar availability loaded successfully.",
      ...result,
    });
  } catch (error) {
    console.error("getCampaignCalendarAvailabilityController error:", error);

    const message = getErrorMessage(
      error,
      "Unable to load campaign calendar availability."
    );

    return res.status(getValidationStatusCode(message)).json({ message });
  }
}

export async function continueToReviewController(req: Request, res: Response) {
  try {
    const {
      campaignName,
      organization,
      contactEmail,
      goal,
      notes,
      eventId,
      orgUuid,
      source,
    } = req.body;

    if (!campaignName || !String(campaignName).trim()) {
      return res.status(400).json({
        message: "Campaign name is required.",
      });
    }

    if (!organization || !String(organization).trim()) {
      return res.status(400).json({
        message: "Organization is required.",
      });
    }

    if (!contactEmail || !String(contactEmail).trim()) {
      return res.status(400).json({
        message: "Contact email is required.",
      });
    }

    const items: ReserveCampaignItemsInput = normalizeCampaignItems(
      req.body?.items
    );

    const payload: ReserveCampaignInput = {
      campaignName: String(campaignName).trim(),
      organization: String(organization).trim(),
      contactEmail: String(contactEmail).trim(),
      goal: goal ? String(goal).trim() : null,
      notes: notes ? String(notes).trim() : null,
      items,
      userId: (req as any)?.user?.id || null,
      eventId: eventId ? String(eventId).trim() : null,
      orgUuid: orgUuid ? String(orgUuid).trim() : null,
      source: source ? String(source).trim() : null,
    };

    const result = await reserveCampaign(payload);

    return res.status(201).json({
      message: "Campaign is ready for review.",
      ...result,
    });
  } catch (error) {
    console.error("continueToReviewController error:", error);

    const message = getErrorMessage(
      error,
      "Unable to continue to campaign review."
    );

    return res.status(getValidationStatusCode(message)).json({ message });
  }
}

export async function createCampaignReviewController(
  req: Request,
  res: Response
) {
  try {
    const { campaignId } = req.body;

    if (!campaignId || !String(campaignId).trim()) {
      return res.status(400).json({
        message: "campaignId is required.",
      });
    }

    const review = await createCampaignReview(String(campaignId).trim());

    return res.status(200).json(review);
  } catch (error) {
    console.error("createCampaignReviewController error:", error);

    return res.status(500).json({
      message: getErrorMessage(error, "Unable to create campaign review."),
    });
  }
}

export async function createCampaignCheckoutSessionController(
  req: Request,
  res: Response
) {
  try {
    const { campaignId } = req.body;

    if (!campaignId || !String(campaignId).trim()) {
      return res.status(400).json({
        message: "campaignId is required.",
      });
    }

    const result = await createCampaignCheckoutSession(
      String(campaignId).trim()
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("createCampaignCheckoutSessionController error:", error);

    return res.status(500).json({
      message: getErrorMessage(
        error,
        "Unable to create campaign checkout session."
      ),
    });
  }
}

export async function uploadCampaignPromoMediaController(
  req: Request,
  res: Response
) {
  try {
    const { campaignId, placementType, campaignItemId, eventId } = req.body;

    if (!campaignId || !String(campaignId).trim()) {
      return res.status(400).json({
        message: "campaignId is required.",
      });
    }

    if (!isValidPlacementType(placementType)) {
      return res.status(400).json({
        message: "placementType is required and must be valid.",
      });
    }

    const file = getUploadedFile(req);

    if (!file) {
      return res.status(400).json({
        message: "Promo media file is required.",
      });
    }

    const normalizedPlacementType = normalizePlacementType(
      placementType
    ) as PlacementType;

    const payload: UploadCampaignPromoMediaInput = {
      campaignId: String(campaignId).trim(),
      campaignItemId: campaignItemId ? String(campaignItemId).trim() : null,
      placementType: normalizedPlacementType as any,
      file,
      uploadedByUserId: (req as any)?.user?.id || null,
      uploadedByOrgUuid: req.body?.orgUuid
        ? String(req.body.orgUuid).trim()
        : null,
      source: req.body?.source ? String(req.body.source).trim() : null,
    };

    
    const result = await uploadCampaignPromoMedia(payload);

    const uploadedBy =
      (req as any)?.user?.id ||
      req.body?.uploadedBy ||
      req.body?.userId ||
      "system";

    const fileUrl =
      (file as any).location ||
      (file as any).location ||
      (file as any).secure_url ||
      (file as any).url ||
      ((file as any).filename
       ? `/uploads/campaigns/${(file as any).filename}`
       : null);
       
          console.log("CAMPAIGN MEDIA PAYLOAD", {
      campaignId: String(campaignId).trim(),
      promoPurchaseId: null,
      eventId: eventId ? String(eventId).trim() : null,
      placementType: normalizedPlacementType,
      mediaSlot: getMediaSlot(normalizedPlacementType),
      fileUrl,
      thumbnailUrl: null,
      fileSizeMB: Number(((file.size || 0) / 1024 / 1024).toFixed(2)),
      mimeType: file.mimetype || "application/octet-stream",
      width: Number(req.body?.width || 0),
      height: Number(req.body?.height || 0),
      uploadedBy,
      replacesMediaId: req.body?.replacesMediaId
        ? String(req.body.replacesMediaId).trim()
        : null,
    });

    if (!fileUrl) {
      throw new Error("Uploaded media URL could not be resolved.");
    }

    const campaignMediaResult = await createPendingCampaignMedia({
      campaignId: String(campaignId).trim(),
      promoPurchaseId: null,
      eventId: eventId ? String(eventId).trim() : null,
      placementType: normalizedPlacementType,
      mediaSlot: getMediaSlot(normalizedPlacementType),
      fileUrl,
      thumbnailUrl: null,
      fileSizeMB: Number(((file.size || 0) / 1024 / 1024).toFixed(2)),
      mimeType: file.mimetype || "application/octet-stream",
      width: Number(req.body?.width || 0),
      height: Number(req.body?.height || 0),
      uploadedBy,
      replacesMediaId: req.body?.replacesMediaId
        ? String(req.body.replacesMediaId).trim()
        : null,
    });

    if (!campaignMediaResult.success) {
      return res.status(400).json({
        message: "Promo media uploaded, but campaign media registration failed.",
        promoMedia: result,
        campaignMedia: campaignMediaResult,
      });
    }

    return res.status(201).json({
      message: "Promo media uploaded successfully and is pending review.",
      ...result,
      campaignMedia: campaignMediaResult,
      campaignMediaWarnings: campaignMediaResult.warnings,
    });
  } catch (error) {
    console.error("uploadCampaignPromoMediaController error:", error);

    const message = getErrorMessage(
      error,
      "Unable to upload campaign promo media."
    );

    return res.status(getValidationStatusCode(message)).json({ message });
  }
}

export async function getCampaignPromoMediaStatusController(
  req: Request,
  res: Response
) {
  try {
    const campaignId = String(
      req.params?.campaignId || req.query?.campaignId || req.body?.campaignId || ""
    ).trim();

    const placementType =
      req.params?.placementType ||
      req.query?.placementType ||
      req.body?.placementType;

    const campaignItemId =
      req.params?.campaignItemId ||
      req.query?.campaignItemId ||
      req.body?.campaignItemId;

    if (!campaignId) {
      return res.status(400).json({
        message: "campaignId is required.",
      });
    }

    if (!isValidPlacementType(placementType)) {
      return res.status(400).json({
        message: "placementType is required and must be valid.",
      });
    }

    const payload: GetCampaignPromoMediaStatusInput = {
      campaignId,
      placementType: normalizePlacementType(placementType) as any,
      campaignItemId: campaignItemId ? String(campaignItemId).trim() : null,
      requestedByUserId: (req as any)?.user?.id || null,
    };

    const result = await getCampaignPromoMediaStatus(payload);

    return res.status(200).json({
      message: "Promo media status loaded successfully.",
      ...result,
    });
  } catch (error) {
    console.error("getCampaignPromoMediaStatusController error:", error);

    const message = getErrorMessage(
      error,
      "Unable to load campaign promo media status."
    );

    return res.status(getValidationStatusCode(message)).json({ message });
  }
}

export async function getCampaignPaymentSuccessController(
  req: Request,
  res: Response
) {
  try {
    const sessionId = String(req.query?.session_id || "").trim();

    if (!sessionId) {
      return res.status(400).json({
        message: "session_id is required.",
      });
    }

    const data = await getCampaignPaymentSuccessBySessionId(sessionId);

    return res.status(200).json({
      message: "Campaign payment success loaded successfully.",
      data,
    });
  } catch (error) {
    console.error("getCampaignPaymentSuccessController error:", error);

    return res.status(500).json({
      message: getErrorMessage(
        error,
        "Unable to load campaign payment success details."
      ),
    });
  }
}

export const reserveCampaignController = continueToReviewController;