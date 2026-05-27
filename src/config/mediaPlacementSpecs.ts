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
  homepage_top: {
  primary: {
    placementType: "homepage_top",
    mediaSlot: "primary",
    label: "Homepage Top Row",
    category: "Homepage Placement",
    location: "Top row placement on homepage discovery area.",
    recommendedWidth: 1200,
    recommendedHeight: 675,
    minWidth: 1000,
    minHeight: 560,
    aspectRatio: "wide_landscape",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 8,
    requiresMedia: true,
    mockupShape: "card",
    bestFor: "Homepage promotional rows.",
    note: "Use clean wide promotional graphics.",
  },
},

discovery_top: {
  primary: {
    placementType: "discovery_top",
    mediaSlot: "primary",
    label: "Discovery Top Row",
    category: "Discovery Placement",
    location: "Top row placement on discovery pages.",
    recommendedWidth: 1200,
    recommendedHeight: 675,
    minWidth: 1000,
    minHeight: 560,
    aspectRatio: "wide_landscape",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 8,
    requiresMedia: true,
    mockupShape: "card",
    bestFor: "Discovery feed promotions.",
    note: "Keep important text centered.",
  },
},

featured_badge: {
  primary: {
    placementType: "featured_badge",
    mediaSlot: "primary",
    label: "Featured Badge",
    category: "Event Promotion",
    location: "Featured event badge area.",
    recommendedWidth: 600,
    recommendedHeight: 600,
    minWidth: 400,
    minHeight: 400,
    aspectRatio: "square",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 5,
    requiresMedia: true,
    mockupShape: "badge",
    bestFor: "Featured event graphics.",
    note: "Square image recommended.",
  },
},

major_events: {
  primary: {
    placementType: "major_events",
    mediaSlot: "primary",
    label: "Major Events",
    category: "Major Event Promotion",
    location: "Major events section.",
    recommendedWidth: 1200,
    recommendedHeight: 675,
    minWidth: 1000,
    minHeight: 560,
    aspectRatio: "wide_landscape",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 8,
    requiresMedia: true,
    mockupShape: "hero",
    bestFor: "Major conference and revival promotions.",
    note: "Use strong high-visibility artwork.",
  },
},

official_flyer: {
  primary: {
    placementType: "official_flyer",
    mediaSlot: "primary",
    label: "Official Event Flyer",
    category: "Event Detail Placement",
    location: "Official flyer area on event detail page.",
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    minWidth: 800,
    minHeight: 1000,
    aspectRatio: "vertical_flyer",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 10,
    requiresMedia: true,
    mockupShape: "flyer",
    bestFor: "Official event flyers and posters.",
    note: "Displayed on public event detail pages.",
  },
},
event_detail_hero: {
  primary: {
    placementType: "event_detail_hero",
    mediaSlot: "primary",
    label: "Event Detail Hero Image",
    category: "Event Detail Media",
    location: "Main hero image on the public event detail page.",
    recommendedWidth: 1600,
    recommendedHeight: 900,
    minWidth: 1200,
    minHeight: 675,
    aspectRatio: "wide_landscape",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 8,
    requiresMedia: true,
    mockupShape: "hero",
    bestFor: "Main event cover images shown at the top of event detail pages.",
    note: "Use a clean wide image with important text away from edges.",
  },
},

event_detail_flyer: {
  primary: {
    placementType: "event_detail_flyer",
    mediaSlot: "primary",
    label: "Event Detail Flyer",
    category: "Event Detail Media",
    location: "Official flyer section on the public event detail page.",
    recommendedWidth: 1080,
    recommendedHeight: 1350,
    minWidth: 800,
    minHeight: 1000,
    aspectRatio: "vertical_flyer",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeMB: 10,
    requiresMedia: true,
    mockupShape: "flyer",
    bestFor: "Event flyers, posters, conference graphics, and service flyers.",
    note: "Hide the flyer section when no flyer exists.",
  },
},

sponsor_logo: {
  primary: {
    placementType: "sponsor_logo",
    mediaSlot: "primary",
    label: "Sponsor Logo",
    category: "Sponsor Media",
    location: "Sponsor display area on event detail pages.",
    recommendedWidth: 800,
    recommendedHeight: 800,
    minWidth: 300,
    minHeight: 300,
    aspectRatio: "square",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    maxFileSizeMB: 5,
    requiresMedia: false,
    mockupShape: "badge",
    bestFor: "Church, ministry, business, or organization logos.",
    note: "Sponsor logos should be stored canonically in event_sponsors.logo_url.",
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