// ================================
// JUDAH GLOBAL — EVENT OPTIONS
// Single source of truth for dropdowns + validation
// ================================

// EVENT TYPES (aligns with DB: event_type)
export const EVENT_TYPES = [
  "Conference",
  "Concert/Musical",
  "Business",
  "Service",
  "Podcast",
  "Seminar",
  "Workshop",
  "Community Event",
  "Festival",
  "Networking",
  "Other",
] as const;

// SPONSOR TYPES
export const SPONSOR_TYPES = [
  "Organization",
  "Church/Ministry",
  "Synagogue",
  "Artist",
  "Individual",
  "Business",
] as const;

// TIMEZONES (expandable globally later)
export const TIMEZONES = [
  { label: "Eastern (EST)", value: "America/New_York" },
  { label: "Central (CST)", value: "America/Chicago" },
  { label: "Mountain (MST)", value: "America/Denver" },
  { label: "Pacific (PST)", value: "America/Los_Angeles" },
];

// ================================
// VALIDATION HELPERS
// ================================

export function isValidEventType(value: string): boolean {
  return EVENT_TYPES.includes(value as (typeof EVENT_TYPES)[number]);
}

export function isValidSponsorType(value: string): boolean {
  return SPONSOR_TYPES.includes(value as (typeof SPONSOR_TYPES)[number]);
}