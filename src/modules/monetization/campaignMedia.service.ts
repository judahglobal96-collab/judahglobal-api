import { db } from "../../config/db";
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

    await db.query(
  `
    INSERT INTO campaign_media (
      id,

      campaign_id,
      promo_purchase_id,
      event_id,

      placement_type,
      media_slot,

      file_url,
      thumbnail_url,

      moderation_status,
      lifecycle_status,
      deployment_status,

      is_current_live,

      replaces_media_id,
      replaced_by_media_id,

      uploaded_by,

      approved_by,
      approved_at,

      rejected_by,
      rejected_at,
      rejection_reason,

      created_at,
      updated_at
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22 )
  `,
  [
    media.id,

    media.campaignId,
    media.promoPurchaseId,
    media.eventId,

    media.placementType,
    media.mediaSlot,

    media.fileUrl,
    media.thumbnailUrl,

    media.moderationStatus,
    media.lifecycleStatus,
    media.deploymentStatus,

    media.isCurrentLive,

    media.replacesMediaId,
    media.replacedByMediaId,

    media.uploadedBy,

    media.approvedBy,
    media.approvedAt,

    media.rejectedBy,
    media.rejectedAt,
    media.rejectionReason,

    media.createdAt,
    media.updatedAt,
  ]
);

  return {
    success: true,
    media,
    errors: [],
    warnings: validation.warnings,
  };
}
// LEGACY ARM MIGRATION NOTE:
// These campaign media review queries are no longer the source of truth.
// ARM owns pending/approved/rejected media moderation through
// /api/v1/admin/media-review.
// Keep temporarily while campaignMedia.controller.ts remains in the codebase.
export async function getPendingCampaignMedia() {
  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE moderation_status = 'pending'
      AND deployment_status = 'ready_for_review'
      ORDER BY created_at DESC
    `
  );

  return result.rows;
}
// LEGACY: Campaign media review queue.
// ARM now owns pending/approved/rejected media moderation.
// Keep temporarily until campaignMedia.controller.ts is fully retired.

export async function getApprovedCampaignMedia() {
  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE moderation_status = 'approved'
      ORDER BY approved_at DESC NULLS LAST, created_at DESC
    `
  );

  return result.rows;
}
// LEGACY: Campaign media review queue.
// ARM now owns pending/approved/rejected media moderation.
// Keep temporarily until campaignMedia.controller.ts is fully retired.
// /api/v1/admin/media-review.
// Keep temporarily while campaignMedia.controller.ts remains in the codebase.

export async function getRejectedCampaignMedia() {
  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE moderation_status = 'rejected'
      ORDER BY rejected_at DESC NULLS LAST, created_at DESC
    `
  );

  return result.rows;
}

export async function approveCampaignMediaReplacement(
  params: ApproveCampaignMediaParams
) {
const now = new Date();

await db.query("BEGIN");

try {
  const replacementResult = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE id = $1
      FOR UPDATE
    `,
    [params.replacementMediaId]
  );

  const replacement = replacementResult.rows[0];

  if (!replacement) {
    throw new Error("Replacement media not found.");
  }

  if (replacement.moderation_status !== "pending") {
    throw new Error("Replacement media is not pending review.");
  }

  const currentMediaId =
    params.currentMediaId ?? replacement.replaces_media_id ?? null;

    await db.query(
  `
    UPDATE campaign_media
    SET
      lifecycle_status = 'replaced',
      deployment_status = 'archived',
      is_current_live = false,
      replaced_by_media_id = $4,
      updated_at = $3
    WHERE placement_type = $1
      AND media_slot = $2
      AND is_current_live = true
      AND id <> $4
  `,
  [
    replacement.placement_type,
    replacement.media_slot,
    now,
    params.replacementMediaId,
  ]
);

  if (currentMediaId) {
    await db.query(
      `
        UPDATE campaign_media
        SET
          lifecycle_status = 'replaced',
          deployment_status = 'archived',
          is_current_live = false,
          replaced_by_media_id = $2,
          updated_at = $3
        WHERE id = $1
      `,
      [currentMediaId, params.replacementMediaId, now]
    );
  }

  await db.query(
    `
      UPDATE campaign_media
      SET
        moderation_status = 'approved',
        lifecycle_status = 'active',
        deployment_status = 'live',
        is_current_live = true,
        approved_by = $2,
        approved_at = $3,
        updated_at = $3
      WHERE id = $1
    `,
    [params.replacementMediaId, params.adminUserId, now]
  );

  await db.query("COMMIT");

  return {
    success: true,
    replacementMediaId: params.replacementMediaId,
    currentMediaId,
    approvedBy: params.adminUserId,
    approvedAt: now,
  };
} catch (error) {
  await db.query("ROLLBACK");
  throw error;
}
}
// LEGACY MODERATION FLOW
// Approval/rejection responsibilities have been migrated to ARM.
// Retained temporarily for compatibility until ARM migration is complete.
export async function rejectCampaignMediaReplacement(
  params: RejectCampaignMediaParams
) {
const now = new Date();

const result = await db.query(
  `
    UPDATE campaign_media
    SET
      moderation_status = 'rejected',
      lifecycle_status = 'rejected',
      deployment_status = 'archived',
      is_current_live = false,
      rejected_by = $2,
      rejected_at = $3,
      rejection_reason = $4,
      updated_at = $3
    WHERE id = $1
      AND moderation_status = 'pending'
    RETURNING id
  `,
  [
    params.replacementMediaId,
    params.adminUserId,
    now,
    params.rejectionReason ?? null,
  ]
);

if (result.rowCount === 0) {
  throw new Error("Pending replacement media not found.");
}

return {
  success: true,
  replacementMediaId: params.replacementMediaId,
  rejectedBy: params.adminUserId,
  rejectedAt: now,
  rejectionReason: params.rejectionReason ?? null,
};
}

export async function getCampaignMediaHistory(params: {
  placementType?: string;
  mediaSlot?: string;
  eventId?: string;
  promoPurchaseId?: string;
  campaignId?: string;
}) {
  const values: any[] = [];
  const filters: string[] = [];

  if (params.placementType) {
    values.push(params.placementType);
    filters.push(`placement_type = $${values.length}`);
  }

  if (params.mediaSlot) {
    values.push(params.mediaSlot);
    filters.push(`media_slot = $${values.length}`);
  }

  if (params.eventId) {
    values.push(params.eventId);
    filters.push(`event_id = $${values.length}`);
  }

  if (params.promoPurchaseId) {
    values.push(params.promoPurchaseId);
    filters.push(`promo_purchase_id = $${values.length}`);
  }

  if (params.campaignId) {
    values.push(params.campaignId);
    filters.push(`campaign_id = $${values.length}`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      ${whereClause}
      ORDER BY created_at DESC
    `,
    values
  );

  return result.rows;
}
export async function getLiveCampaignMedia() {
  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE is_current_live = true
      AND moderation_status = 'approved'
      AND deployment_status = 'live'
      ORDER BY placement_type, media_slot, created_at DESC
    `
  );

  return result.rows;
}

export async function getCurrentLiveCampaignMedia(params: {
  campaignId?: string;
  promoPurchaseId?: string;
  eventId?: string;
  placementType: string;
  mediaSlot: string;
}) {
  const values: any[] = [params.placementType, params.mediaSlot];

  const filters = [
    "placement_type = $1",
    "media_slot = $2",
    "moderation_status = 'approved'",
    "lifecycle_status = 'active'",
    "deployment_status = 'live'",
    "is_current_live = true",
  ];

  if (params.campaignId) {
    values.push(params.campaignId);
    filters.push(`campaign_id = $${values.length}`);
  }

  if (params.promoPurchaseId) {
    values.push(params.promoPurchaseId);
    filters.push(`promo_purchase_id = $${values.length}`);
  }

  if (params.eventId) {
    values.push(params.eventId);
    filters.push(`event_id = $${values.length}`);
  }

  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE ${filters.join(" AND ")}
      ORDER BY approved_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    `,
    values
  );

  return result.rows[0] ?? null;
}
