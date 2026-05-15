"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventVerification_controller_1 = require("../controllers/eventVerification.controller");
const router = (0, express_1.Router)();
router.post("/:eventId/send-otp", eventVerification_controller_1.sendEventOTP);
router.post("/verify-otp", eventVerification_controller_1.verifyEventOTP);
exports.default = router;
