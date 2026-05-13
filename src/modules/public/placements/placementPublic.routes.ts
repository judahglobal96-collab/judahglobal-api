import { Router } from "express";
import {
  getDiscoveryPlacementsController,
  getHomepagePlacementsController,
  getPlacementBySurfaceAndCodeController,
  getPlacementsBySurfaceController,
} from "./placementPublic.controller";

const router = Router();

/**
 * Homepage placements
 * Returns both website_homepage and app_homepage surfaces.
 * Optional query:
 *   ?as_of_date=YYYY-MM-DD
 */
router.get("/homepage", getHomepagePlacementsController);

/**
 * Discovery placements
 * Returns event_discovery surface placements.
 * Optional query:
 *   ?as_of_date=YYYY-MM-DD
 */
router.get("/discovery", getDiscoveryPlacementsController);

/**
 * Generic surface lookup
 * Examples:
 *   /surface/website_homepage
 *   /surface/app_homepage
 *   /surface/event_discovery
 *
 * Optional queries:
 *   ?as_of_date=YYYY-MM-DD
 *   ?placement_code=website_homepage_top_row
 */
router.get("/surface/:surfaceCode", getPlacementsBySurfaceController);

/**
 * Specific placement on a given surface
 * Examples:
 *   /surface/website_homepage/website_homepage_top_row
 *   /surface/app_homepage/app_homepage_hero
 *   /surface/event_discovery/discovery_top_row
 *
 * Optional query:
 *   ?as_of_date=YYYY-MM-DD
 */
router.get(
  "/surface/:surfaceCode/:placementCode",
  getPlacementBySurfaceAndCodeController
);

export default router;