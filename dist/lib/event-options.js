"use strict";
// ================================
// JUDAH GLOBAL — EVENT OPTIONS
// Single source of truth for dropdowns + validation
// ================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIMEZONES = exports.SPONSOR_TYPES = exports.EVENT_TYPES = void 0;
exports.isValidEventType = isValidEventType;
exports.isValidSponsorType = isValidSponsorType;
// EVENT TYPES (aligns with DB: event_type)
exports.EVENT_TYPES = [
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
];
// SPONSOR TYPES
exports.SPONSOR_TYPES = [
    "Organization",
    "Church/Ministry",
    "Synagogue",
    "Artist",
    "Individual",
    "Business",
];
// TIMEZONES (expandable globally later)
exports.TIMEZONES = [
    { label: "Eastern (EST)", value: "America/New_York" },
    { label: "Central (CST)", value: "America/Chicago" },
    { label: "Mountain (MST)", value: "America/Denver" },
    { label: "Pacific (PST)", value: "America/Los_Angeles" },
];
// ================================
// VALIDATION HELPERS
// ================================
function isValidEventType(value) {
    return exports.EVENT_TYPES.includes(value);
}
function isValidSponsorType(value) {
    return exports.SPONSOR_TYPES.includes(value);
}
