import { Router } from "express";
import { getAllDiscoveredEvents } from "../controllers/eventDiscovery.controller";

const router = Router();

router.get("/events", getAllDiscoveredEvents);

export default router;