"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventEngagement_controller_1 = require("../controllers/eventEngagement.controller");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/event-engagement/click
 * Body:
 * {
 *   "eventId": "uuid",
 *   "actionType": "click",
 *   "source": "discovery"
 * }
 */
router.post("/click", eventEngagement_controller_1.trackEventEngagement);
exports.default = router;
