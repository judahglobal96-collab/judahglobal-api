import { Router } from "express";
import {
  createPlacementHoldSessionController,
  getPlacementHoldSessionController,
  releasePlacementHoldSessionController,
} from "./controllers/placementHold.controller";

import { requireAuth } from "../../middleware/auth.middleware"; 

const router = Router();

router.post(
  "/hold",
  requireAuth,
  createPlacementHoldSessionController
);

router.get(
  "/hold/:holdSessionId",
  requireAuth,
  getPlacementHoldSessionController
);

router.delete(
  "/hold/:holdSessionId",
  requireAuth,
  releasePlacementHoldSessionController
);

export default router;