"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventDiscovery_controller_1 = require("../controllers/eventDiscovery.controller");
const router = (0, express_1.Router)();
router.get("/events", eventDiscovery_controller_1.getAllDiscoveredEvents);
exports.default = router;
