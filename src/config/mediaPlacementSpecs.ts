export type MediaPlacementSpec = {
  placementType: string;
  mediaSlot: string;
  label: string;
  category: string;
  location: string;

  recommendedWidth: number;
  recommendedHeight: number;
  minWidth: number;
  minHeight: number;
  aspectRatio: string;

  allowedMimeTypes: string[];
  maxFileSizeMB: number;
  requiresMedia: boolean;

  mockupShape: "hero" | "card" | "flyer" | "badge";
  bestFor: string;
  note: string;
};

export const MEDIA_PLACEMENT_SPECS: Record<string, Record<string, MediaPlacementSpec>> = {
  homepage_hero: {
    desktop: {
      placementType: "homepage_hero",
      mediaSlot: "desktop",
      label: "Homepage Hero",
      category: "Homepage Placement",
      location: "Top featured area of the Judah Global homepage.",
      recommendedWidth: 1920,
      recommendedHeight: 900,
      minWidth: 1600,
      minHeight: 750,
      aspectRatio: "wide_landscape",
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      maxFileSizeMB: 8,
      requiresMedia: true,
      mockupShape: "hero",
      bestFor: "Major conferences, revivals, tours, Podcast, and high-priority promotions.",
      note: "Use a wide image with important text centered and away from the edges.",
    },
  },
};
export function getMediaPlacementSpec(
  placementType: string,
  mediaSlot: string
): MediaPlacementSpec | null {
  return MEDIA_PLACEMENT_SPECS[placementType]?.[mediaSlot] ?? null;
}

export function formatRecommendedSize(spec: MediaPlacementSpec): string {
  return `${spec.recommendedWidth} × ${spec.recommendedHeight}px`;
}
export type MediaValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};
export type MediaValidationInput = {
  fileSizeMB: number;
  mimeType: string;
  width: number;
  height: number;
  placementType: string;
  mediaSlot: string;
};
export function validateMediaAgainstSpec(
  input: MediaValidationInput
): MediaValidationResult {
  const spec = getMediaPlacementSpec(input.placementType, input.mediaSlot);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!spec) {
    return {
      valid: false,
      errors: ["Unknown media placement or slot."],
      warnings,
    };
  }

  if (!spec.requiresMedia) {
    return { valid: true, errors, warnings };
  }

  if (!spec.allowedMimeTypes.includes(input.mimeType)) {
    errors.push("Unsupported file type.");
  }

  if (input.fileSizeMB > spec.maxFileSizeMB) {
    errors.push(`File must be ${spec.maxFileSizeMB}MB or smaller.`);
  }

  if (input.width < spec.minWidth || input.height < spec.minHeight) {
    errors.push(
      `Image must be at least ${spec.minWidth} × ${spec.minHeight}px.`
    );
  }

  if (
    input.width !== spec.recommendedWidth ||
    input.height !== spec.recommendedHeight
  ) {
    warnings.push(
      `Recommended size is ${formatRecommendedSize(spec)}.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}