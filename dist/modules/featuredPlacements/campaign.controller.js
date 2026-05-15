"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveCampaignController = void 0;
exports.checkCampaignAvailabilityController = checkCampaignAvailabilityController;
exports.getCampaignCalendarAvailabilityController = getCampaignCalendarAvailabilityController;
exports.continueToReviewController = continueToReviewController;
exports.createCampaignReviewController = createCampaignReviewController;
exports.createCampaignCheckoutSessionController = createCampaignCheckoutSessionController;
exports.uploadCampaignPromoMediaController = uploadCampaignPromoMediaController;
exports.getCampaignPromoMediaStatusController = getCampaignPromoMediaStatusController;
exports.getCampaignPaymentSuccessController = getCampaignPaymentSuccessController;
const campaign_service_1 = require("./campaign.service");
function isValidPlacementType(value) {
    return (value === "hero" ||
        value === "homepage_hero" ||
        value === "homepage_top" ||
        value === "homepage_top_row" ||
        value === "discovery_top" ||
        value === "discovery_top_row" ||
        value === "featured_badge" ||
        value === "major_events" ||
        value === "official_flyer" ||
        value === "event_fee" ||
        value === "event_submission_fee");
}
function isDurationPlacement(placementType) {
    return placementType === "featured_badge" || placementType === "major_events";
}
function isValidDateString(value) {
    if (typeof value !== "string" || !value.trim())
        return false;
    const parsed = new Date(`${value}T00:00:00`);
    return !Number.isNaN(parsed.getTime());
}
function normalizeCampaignItems(items) {
    if (!Array.isArray(items)) {
        throw new Error("Campaign items are required.");
    }
    if (items.length === 0) {
        throw new Error("At least one campaign item is required.");
    }
    return items.map((rawItem, index) => {
        const item = rawItem;
        if (!isValidPlacementType(item.placementType)) {
            throw new Error(`Item ${index + 1}: placementType is invalid.`);
        }
        if (!isValidDateString(item.startDate)) {
            throw new Error(`Item ${index + 1}: startDate is required and must be a valid date.`);
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
        if (isDurationPlacement(item.placementType) &&
            (!Number.isFinite(durationDays) || durationDays < 1)) {
            throw new Error(`Item ${index + 1}: durationDays must be at least 1.`);
        }
        return {
            placementType: item.placementType,
            placementDate: item.startDate,
            slotNumber: null,
            quantity,
            durationDays,
            regionCode: item.regionCode || null,
        };
    });
}
function getErrorMessage(error, fallback) {
    return error instanceof Error ? error.message : fallback;
}
function getValidationStatusCode(message) {
    return message.includes("required") || message.includes("invalid") ? 400 : 500;
}
function getUploadedFile(req) {
    const singleFile = req.file;
    if (singleFile)
        return singleFile;
    const files = req.files;
    if (Array.isArray(files) && files.length > 0)
        return files[0];
    return null;
}
async function checkCampaignAvailabilityController(req, res) {
    try {
        const items = normalizeCampaignItems(req.body?.items);
        const results = await (0, campaign_service_1.checkCampaignAvailability)(items);
        return res.status(200).json({
            message: "Availability checked successfully.",
            results,
        });
    }
    catch (error) {
        console.error("checkCampaignAvailabilityController error:", error);
        const message = getErrorMessage(error, "Unable to check campaign availability.");
        return res.status(getValidationStatusCode(message)).json({ message });
    }
}
async function getCampaignCalendarAvailabilityController(req, res) {
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
        const payload = {
            placementType,
            startDate,
            weeks: normalizedWeeks,
            regionCode: req.body.regionCode || req.body.region || "USA",
            eventId: req.body.eventId || null,
        };
        const result = await (0, campaign_service_1.getCampaignCalendarAvailability)(payload);
        return res.status(200).json({
            message: "Calendar availability loaded successfully.",
            ...result,
        });
    }
    catch (error) {
        console.error("getCampaignCalendarAvailabilityController error:", error);
        const message = getErrorMessage(error, "Unable to load campaign calendar availability.");
        return res.status(getValidationStatusCode(message)).json({ message });
    }
}
async function continueToReviewController(req, res) {
    try {
        const { campaignName, organization, contactEmail, goal, notes, eventId, orgUuid, source, } = req.body;
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
        const items = normalizeCampaignItems(req.body?.items);
        const payload = {
            campaignName: String(campaignName).trim(),
            organization: String(organization).trim(),
            contactEmail: String(contactEmail).trim(),
            goal: goal ? String(goal).trim() : null,
            notes: notes ? String(notes).trim() : null,
            items,
            userId: req?.user?.id || null,
            eventId: eventId ? String(eventId).trim() : null,
            orgUuid: orgUuid ? String(orgUuid).trim() : null,
            source: source ? String(source).trim() : null,
        };
        const result = await (0, campaign_service_1.reserveCampaign)(payload);
        return res.status(201).json({
            message: "Campaign is ready for review.",
            ...result,
        });
    }
    catch (error) {
        console.error("continueToReviewController error:", error);
        const message = getErrorMessage(error, "Unable to continue to campaign review.");
        return res.status(getValidationStatusCode(message)).json({ message });
    }
}
async function createCampaignReviewController(req, res) {
    try {
        const { campaignId } = req.body;
        if (!campaignId || !String(campaignId).trim()) {
            return res.status(400).json({
                message: "campaignId is required.",
            });
        }
        const review = await (0, campaign_service_1.createCampaignReview)(String(campaignId).trim());
        return res.status(200).json(review);
    }
    catch (error) {
        console.error("createCampaignReviewController error:", error);
        return res.status(500).json({
            message: getErrorMessage(error, "Unable to create campaign review."),
        });
    }
}
async function createCampaignCheckoutSessionController(req, res) {
    try {
        const { campaignId } = req.body;
        if (!campaignId || !String(campaignId).trim()) {
            return res.status(400).json({
                message: "campaignId is required.",
            });
        }
        const result = await (0, campaign_service_1.createCampaignCheckoutSession)(String(campaignId).trim());
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("createCampaignCheckoutSessionController error:", error);
        return res.status(500).json({
            message: getErrorMessage(error, "Unable to create campaign checkout session."),
        });
    }
}
async function uploadCampaignPromoMediaController(req, res) {
    try {
        const { campaignId, placementType, campaignItemId } = req.body;
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
        console.log("PROMO MEDIA FILE OBJECT", file);
        if (!file) {
            return res.status(400).json({
                message: "Promo media file is required.",
            });
        }
        console.log("PROMO MEDIA BODY", req.body);
        const payload = {
            campaignId: String(campaignId).trim(),
            campaignItemId: campaignItemId ? String(campaignItemId).trim() : null,
            placementType,
            file,
            uploadedByUserId: req?.user?.id || null,
            uploadedByOrgUuid: req.body?.orgUuid ? String(req.body.orgUuid).trim() : null,
            source: req.body?.source ? String(req.body.source).trim() : null,
        };
        const result = await (0, campaign_service_1.uploadCampaignPromoMedia)(payload);
        return res.status(201).json({
            message: "Promo media uploaded successfully and is pending review.",
            ...result,
        });
    }
    catch (error) {
        console.error("uploadCampaignPromoMediaController error:", error);
        const message = getErrorMessage(error, "Unable to upload campaign promo media.");
        return res.status(getValidationStatusCode(message)).json({ message });
    }
}
async function getCampaignPromoMediaStatusController(req, res) {
    try {
        const campaignId = String(req.params?.campaignId || req.query?.campaignId || req.body?.campaignId || "").trim();
        const placementType = req.params?.placementType || req.query?.placementType || req.body?.placementType;
        const campaignItemId = req.params?.campaignItemId || req.query?.campaignItemId || req.body?.campaignItemId;
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
        const payload = {
            campaignId,
            placementType,
            campaignItemId: campaignItemId ? String(campaignItemId).trim() : null,
            requestedByUserId: req?.user?.id || null,
        };
        const result = await (0, campaign_service_1.getCampaignPromoMediaStatus)(payload);
        return res.status(200).json({
            message: "Promo media status loaded successfully.",
            ...result,
        });
    }
    catch (error) {
        console.error("getCampaignPromoMediaStatusController error:", error);
        const message = getErrorMessage(error, "Unable to load campaign promo media status.");
        return res.status(getValidationStatusCode(message)).json({ message });
    }
}
async function getCampaignPaymentSuccessController(req, res) {
    try {
        const sessionId = String(req.query?.session_id || "").trim();
        if (!sessionId) {
            return res.status(400).json({
                message: "session_id is required.",
            });
        }
        const data = await (0, campaign_service_1.getCampaignPaymentSuccessBySessionId)(sessionId);
        return res.status(200).json({
            message: "Campaign payment success loaded successfully.",
            data,
        });
    }
    catch (error) {
        console.error("getCampaignPaymentSuccessController error:", error);
        return res.status(500).json({
            message: getErrorMessage(error, "Unable to load campaign payment success details."),
        });
    }
}
exports.reserveCampaignController = continueToReviewController;
