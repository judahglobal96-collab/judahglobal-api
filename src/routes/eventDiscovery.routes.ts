import { Router } from "express";
import {
  getAllDiscoveredEvents,
  getFeaturedEvents,
  searchDiscoveredEvents,
  getDiscoveredEventById,
  indexEventForDiscovery,
  getHomepageHeroPlacement,
  getHomepageTopRowPlacements,
  getDiscoveryTopRowPlacements,
  getMajorEvents,
  getHomepagePromos,
} from "../controllers/eventDiscovery.controller";

const router = Router();

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
router.get("/", searchDiscoveredEvents);


 router.get("/homepage-promos", getHomepagePromos);

/**
 * Featured events
 */
router.get("/featured", getFeaturedEvents);

/**
 * Homepage Hero promo placement
 * Returns 2 Hero items highest-priority approved hero promo event
 */
router.get("/placements/homepage-hero", getHomepageHeroPlacement);

/**
 * Homepage Top Row promo placements
 * Returns approved homepage top-row promo events
 */
router.get("/placements/homepage-top-row", getHomepageTopRowPlacements);

/**
 * Discovery Top Row promo placements
 * Returns approved discovery top-row promo events
 */
router.get("/placements/discovery-top-row", getDiscoveryTopRowPlacements);

/**
 * Major Events listing
 * Uses standard event media/fallback rules; no campaign promo media required
 */
router.get("/major-events", getMajorEvents);

/**
 * Optional dedicated search route
 */
router.get("/search", searchDiscoveredEvents);

/**
 * Dev helper for manual indexing
 */
router.post("/:eventId/index-discovery", indexEventForDiscovery);

/**
 * Event detail
 */
router.get("/:eventId", getDiscoveredEventById);

export default router;