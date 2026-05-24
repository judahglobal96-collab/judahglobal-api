import {
  getMediaPlacementSpec,
  validateMediaAgainstSpec,
} from "../../config/mediaPlacementSpecs";

import type {
  CampaignMediaRecord,
  CreateCampaignMediaParams,
  ApproveCampaignMediaParams,
  RejectCampaignMediaParams,
} from "./campaignMedia.model";

function createId() {
  return crypto.randomUUID();
}

export async function createPendingCampaignMedia(
  input: CreateCampaignMediaParams
): Promise<{
  success: boolean;
  media?: CampaignMediaRecord;
  errors: string[];
  warnings: string[];
}> {
  const spec = getMediaPlacementSpec(input.placementType, input.mediaSlot);

  if (!spec) {
    return {
      success: false,
      errors: ["Unknown media placement or slot."],
      warnings: [],
    };
  }

  const validation = validateMediaAgainstSpec({
    placementType: input.placementType,
    mediaSlot: input.mediaSlot,
    fileSizeMB: input.fileSizeMB,
    mimeType: input.mimeType,
    width: input.width,
    height: input.height,
  });

  if (!validation.valid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  const media: CampaignMediaRecord = {
    id: createId(),

    campaignId: input.campaignId ?? null,
    promoPurchaseId: input.promoPurchaseId ?? null,
    eventId: input.eventId ?? null,

    placementType: input.placementType,
    mediaSlot: input.mediaSlot,

    fileUrl: input.fileUrl,
    thumbnailUrl: input.thumbnailUrl ?? null,

    moderationStatus: "pending",
    lifecycleStatus: input.replacesMediaId ? "active_candidate" : "active",
    deploymentStatus: "ready_for_review",

    isCurrentLive: false,

    replacesMediaId: input.replacesMediaId ?? null,
    replacedByMediaId: null,

    uploadedBy: input.uploadedBy,

    approvedBy: null,
    approvedAt: null,

    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,

    createdAt: new Date(),
    updatedAt: null,
  };

  // TODO: insert media into database here

  return {
    success: true,
    media,
    errors: [],
    warnings: validation.warnings,
  };
}

export async function approveCampaignMediaReplacement(
  params: ApproveCampaignMediaParams
) {
  const now = new Date();

  // TODO: wrap in DB transaction
  // 1. Mark current media replaced/archived and isCurrentLive = false
  // 2. Mark replacement approved/active/live and isCurrentLive = true

  return {
    success: true,
    replacementMediaId: params.replacementMediaId,
    currentMediaId: params.currentMediaId ?? null,
    approvedBy: params.adminUserId,
    approvedAt: now,
  };
}

export async function rejectCampaignMediaReplacement(
  params: RejectCampaignMediaParams
) {
  const now = new Date();

  // TODO: update replacement media:
  // moderationStatus = rejected
  // lifecycleStatus = rejected
  // deploymentStatus = archived
  // isCurrentLive = false
  //
  // Do not modify current live media.

  return {
    success: true,
    replacementMediaId: params.replacementMediaId,
    rejectedBy: params.adminUserId,
    rejectedAt: now,
    rejectionReason: params.rejectionReason ?? null,
  };
}

export async function getCurrentLiveCampaignMedia(params: {
  campaignId?: string;
  promoPurchaseId?: string;
  eventId?: string;
  placementType: string;
  mediaSlot: string;
}) {
  // TODO: query DB where:
  // moderationStatus = approved
  // lifecycleStatus = active
  // deploymentStatus = live
  // isCurrentLive = true

  return null;
}