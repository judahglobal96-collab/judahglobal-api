"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncEventPromotionFlags = syncEventPromotionFlags;
exports.syncCampaignPromotionFlags = syncCampaignPromotionFlags;
const db_1 = require("../config/db");
function normalizePlacementTypes(rows) {
    return rows
        .map((row) => row.placement_type)
        .filter((value) => Boolean(value));
}
function getPromotionFlags(placementTypes) {
    return {
        hasMajorEvent: placementTypes.includes("major_events"),
        hasFeaturedBadge: placementTypes.includes("featured_badge"),
        hasFeaturedPlacement: placementTypes.includes("hero") ||
            placementTypes.includes("homepage_top") ||
            placementTypes.includes("discovery_top"),
    };
}
async function syncEventPromotionFlags(eventId, client = db_1.db) {
    const placementResult = await client.query(`
    SELECT DISTINCT
      ci.placement_type
    FROM ad_campaign_items ci
    INNER JOIN ad_campaigns c
      ON c.id = ci.campaign_id
    WHERE c.linked_event_id = $1
      AND c.status = 'paid'
      AND ci.status = 'paid'
    `, [eventId]);
    const placementTypes = normalizePlacementTypes(placementResult.rows);
    const { hasMajorEvent, hasFeaturedBadge, hasFeaturedPlacement, } = getPromotionFlags(placementTypes);
    await client.query(`
    UPDATE event_submissions
    SET
      is_major_event = $2,
      has_featured_badge = $3,
      featured = $3,
      has_featured_placement = $4,
      updated_at = NOW()
    WHERE id = $1
    `, [eventId, hasMajorEvent, hasFeaturedBadge, hasFeaturedPlacement]);
    await client.query(`
    UPDATE event_discovery_index
    SET
      is_featured = $2,
      updated_at = NOW()
    WHERE event_id = $1
    `, [eventId, hasFeaturedBadge || hasFeaturedPlacement]);
    return {
        eventId,
        placementTypes,
        hasMajorEvent,
        hasFeaturedBadge,
        hasFeaturedPlacement,
    };
}
async function syncCampaignPromotionFlags(campaignId, client = db_1.db) {
    const campaignResult = await client.query(`
    SELECT linked_event_id
    FROM ad_campaigns
    WHERE id = $1
    LIMIT 1
    `, [campaignId]);
    const eventId = campaignResult.rows[0]?.linked_event_id ?? null;
    if (!eventId) {
        return {
            campaignId,
            eventId: null,
            placementTypes: [],
            hasMajorEvent: false,
            hasFeaturedBadge: false,
            hasFeaturedPlacement: false,
        };
    }
    const result = await syncEventPromotionFlags(eventId, client);
    return {
        ...result,
        campaignId,
    };
}
