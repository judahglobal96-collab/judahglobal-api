import { db } from "../../config/db";
import type { CampaignMediaRecord } from "./campaignMedia.model";

function mapCampaignMediaRow(row: any): CampaignMediaRecord {
  return {
    id: row.id,

    campaignId: row.campaign_id ?? null,
    promoPurchaseId: row.promo_purchase_id ?? null,
    eventId: row.event_id ?? null,

    placementType: row.placement_type,
    mediaSlot: row.media_slot,

    fileUrl: row.file_url,
    thumbnailUrl: row.thumbnail_url ?? null,

    moderationStatus: row.moderation_status,
    lifecycleStatus: row.lifecycle_status,
    deploymentStatus: row.deployment_status,

    isCurrentLive: row.is_current_live,

    replacesMediaId: row.replaces_media_id ?? null,
    replacedByMediaId: row.replaced_by_media_id ?? null,

    uploadedBy: row.uploaded_by,

    approvedBy: row.approved_by ?? null,
    approvedAt: row.approved_at ?? null,

    rejectedBy: row.rejected_by ?? null,
    rejectedAt: row.rejected_at ?? null,
    rejectionReason: row.rejection_reason ?? null,

    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}

export async function getLiveCampaignMedia(params: {
  campaignId?: string;
  promoPurchaseId?: string;
  eventId?: string;
  placementType: string;
  mediaSlot: string;
}): Promise<CampaignMediaRecord | null> {
  const values: any[] = [
    params.placementType,
    params.mediaSlot,
  ];

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

  return result.rows[0] ? mapCampaignMediaRow(result.rows[0]) : null;
}

export async function getLivePlacementMedia(params: {
  placementType: string;
  mediaSlot: string;
  limit?: number;
}): Promise<CampaignMediaRecord[]> {
  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE placement_type = $1
        AND media_slot = $2
        AND moderation_status = 'approved'
        AND lifecycle_status = 'active'
        AND deployment_status = 'live'
        AND is_current_live = true
      ORDER BY approved_at DESC NULLS LAST, created_at DESC
      LIMIT $3
    `,
    [params.placementType, params.mediaSlot, params.limit ?? 20]
  );

  return result.rows.map(mapCampaignMediaRow);
}

export async function getLiveEventPromoMedia(params: {
  eventId: string;
  placementType: string;
  mediaSlot: string;
}): Promise<CampaignMediaRecord | null> {
  return getLiveCampaignMedia({
    eventId: params.eventId,
    placementType: params.placementType,
    mediaSlot: params.mediaSlot,
  });
}

export async function getPendingReplacementMedia(params: {
  replacesMediaId?: string;
  promoPurchaseId?: string;
  campaignId?: string;
  eventId?: string;
  placementType?: string;
  mediaSlot?: string;
}): Promise<CampaignMediaRecord[]> {
  const values: any[] = [];

  const filters = [
    "moderation_status = 'pending'",
    "lifecycle_status = 'active_candidate'",
    "is_current_live = false",
  ];

  if (params.replacesMediaId) {
    values.push(params.replacesMediaId);
    filters.push(`replaces_media_id = $${values.length}`);
  }

  if (params.promoPurchaseId) {
    values.push(params.promoPurchaseId);
    filters.push(`promo_purchase_id = $${values.length}`);
  }

  if (params.campaignId) {
    values.push(params.campaignId);
    filters.push(`campaign_id = $${values.length}`);
  }

  if (params.eventId) {
    values.push(params.eventId);
    filters.push(`event_id = $${values.length}`);
  }

  if (params.placementType) {
    values.push(params.placementType);
    filters.push(`placement_type = $${values.length}`);
  }

  if (params.mediaSlot) {
    values.push(params.mediaSlot);
    filters.push(`media_slot = $${values.length}`);
  }

  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE ${filters.join(" AND ")}
      ORDER BY created_at DESC
    `,
    values
  );

  return result.rows.map(mapCampaignMediaRow);
}

export async function getPendingCampaignMediaReviewQueue(params?: {
  limit?: number;
}): Promise<CampaignMediaRecord[]> {
  const result = await db.query(
    `
      SELECT *
      FROM campaign_media
      WHERE moderation_status = 'pending'
        AND is_current_live = false
      ORDER BY created_at ASC
      LIMIT $1
    `,
    [params?.limit ?? 50]
  );

  return result.rows.map(mapCampaignMediaRow);
}