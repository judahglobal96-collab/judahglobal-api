"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventDiscovery_controller_1 = require("../controllers/eventDiscovery.controller");
const router = (0, express_1.Router)();
/**
 * Main discovery endpoint
 * Supports:
 * ?page=1
 * &limit=12
 * &q=gospel
 * &search=gospel
 * &keyword=gospel
 * &city=Dallas
 * &state_region=TX
 * &country=United States
 * &category=Concert
 */
router.get("/", eventDiscovery_controller_1.getAllDiscoveredEvents);
router.get("/homepage-promos", eventDiscovery_controller_1.getHomepagePromos);
/**
 * Featured events
 */
router.get("/featured", eventDiscovery_controller_1.getFeaturedEvents);
/**
 * Homepage Hero promo placement
 * Returns 2 Hero items highest-priority approved hero promo event
 */
router.get("/placements/homepage-hero", eventDiscovery_controller_1.getHomepageHeroPlacement);
/**
 * Homepage Top Row promo placements
 * Returns approved homepage top-row promo events
 */
router.get("/placements/homepage-top-row", eventDiscovery_controller_1.getHomepageTopRowPlacements);
/**
 * Discovery Top Row promo placements
 * Returns approved discovery top-row promo events
 */
router.get("/placements/discovery-top-row", eventDiscovery_controller_1.getDiscoveryTopRowPlacements);
/**
 * Major Events listing
 * Uses standard event media/fallback rules; no campaign promo media required
 */
router.get("/major-events", eventDiscovery_controller_1.getMajorEvents);
/**
 * Optional dedicated search route
 */
router.get("/search", eventDiscovery_controller_1.searchDiscoveredEvents);
/**
 * Dev helper for manual indexing
 */
router.post("/:eventId/index-discovery", eventDiscovery_controller_1.indexEventForDiscovery);
/**
 * Event detail
 */
router.get("/:eventId", eventDiscovery_controller_1.getDiscoveredEventById);
exports.default = router;
