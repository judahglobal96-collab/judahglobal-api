export type CampaignMediaModerationStatus =
  | "pending"
  | "approved"
  | "rejected";

export type CampaignMediaLifecycleStatus =
  | "active"
  | "active_candidate"
  | "replaced"
  | "archived"
  | "rejected";

export type CampaignMediaDeploymentStatus =
  | "uploading"
  | "processing"
  | "ready_for_review"
  | "approved_pending_publish"
  | "live"
  | "publish_failed"
  | "archived";

export type CampaignMediaRecord = {
  id: string;

  campaignId?: string | null;
  promoPurchaseId?: string | null;
  eventId?: string | null;

  placementType: string;
  mediaSlot: string;

  fileUrl: string;
  thumbnailUrl?: string | null;

  moderationStatus: CampaignMediaModerationStatus;
  lifecycleStatus: CampaignMediaLifecycleStatus;
  deploymentStatus: CampaignMediaDeploymentStatus;

  isCurrentLive: boolean;

  replacesMediaId?: string | null;
  replacedByMediaId?: string | null;

  uploadedBy: string;

  approvedBy?: string | null;
  approvedAt?: Date | null;

  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;

  createdAt: Date;
  updatedAt?: Date | null;
};

export type CreateCampaignMediaParams = {
  campaignId?: string | null;
  promoPurchaseId?: string | null;
  eventId?: string | null;

  placementType: string;
  mediaSlot: string;

  fileUrl: string;
  thumbnailUrl?: string | null;

  fileSizeMB: number;
  mimeType: string;
  width: number;
  height: number;

  uploadedBy: string;
  replacesMediaId?: string | null;
};

export type ApproveCampaignMediaParams = {
  replacementMediaId: string;
  currentMediaId?: string | null;
  adminUserId: string;
};

export type RejectCampaignMediaParams = {
  replacementMediaId: string;
  adminUserId: string;
  rejectionReason?: string;
};

export const CAMPAIGN_MEDIA_PUBLIC_RENDER_RULE = {
  moderationStatus: "approved",
  lifecycleStatus: "active",
  deploymentStatus: "live",
  isCurrentLive: true,
} as const;