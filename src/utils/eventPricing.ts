export type EventPricingInput = {
  hasFeaturedBadge?: boolean;
  hasFeaturedPlacement?: boolean;
  isOrgAccount?: boolean;
};

export type EventPricingBreakdown = {
  baseEventFee: number;
  featuredBadgeFee: number;
  featuredPlacementFee: number;
  orgDiscount: number;
  total: number;
  paymentTypes: string[];
};

const BASE_EVENT_FEE = 7900;
const FEATURED_BADGE_FEE = 7900;

// Temporary placeholder until you lock premium placement pricing
const FEATURED_PLACEMENT_FEE = 24900;

// Temporary placeholder until you lock org discounts
const ORG_EVENT_DISCOUNT = 0;

export function calculateEventPricing(
  input: EventPricingInput
): EventPricingBreakdown {
  const hasFeaturedBadge = Boolean(input.hasFeaturedBadge);
  const hasFeaturedPlacement = Boolean(input.hasFeaturedPlacement);
  const isOrgAccount = Boolean(input.isOrgAccount);

  const baseEventFee = BASE_EVENT_FEE;
  const featuredBadgeFee = hasFeaturedBadge ? FEATURED_BADGE_FEE : 0;
  const featuredPlacementFee = hasFeaturedPlacement ? FEATURED_PLACEMENT_FEE : 0;
  const orgDiscount = isOrgAccount ? ORG_EVENT_DISCOUNT : 0;

  const subtotal = baseEventFee + featuredBadgeFee + featuredPlacementFee;
  const total = Math.max(subtotal - orgDiscount, 0);

  const paymentTypes: string[] = ["event_fee"];

  if (hasFeaturedBadge) {
    paymentTypes.push("featured_badge");
  }

  if (hasFeaturedPlacement) {
    paymentTypes.push("featured_placement");
  }

  return {
    baseEventFee,
    featuredBadgeFee,
    featuredPlacementFee,
    orgDiscount,
    total,
    paymentTypes,
  };
}