"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventSubmission_controller_1 = require("../controllers/eventSubmission.controller");
const eventSchedule_controller_1 = require("../controllers/eventSchedule.controller");
const eventLocation_controller_1 = require("../controllers/eventLocation.controller");
const eventSponsor_controller_1 = require("../controllers/eventSponsor.controller");
const eventReview_controller_1 = require("../controllers/eventReview.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/", (_req, res) => {
    res.json({
        message: "Event submission route working... Judah Global backend live",
    });
});
router.post("/draft", auth_middleware_1.requireAuth, eventSubmission_controller_1.createDraftEvent);
router.post("/events/:eventId/schedule", eventSchedule_controller_1.saveEventSchedule);
router.post("/events/:eventId/location", eventLocation_controller_1.saveEventLocation);
router.post("/events/:eventId/sponsor", eventSponsor_controller_1.saveEventSponsor);
router.get("/events/:eventId/review", eventReview_controller_1.getEventReview);
router.post("/events/:eventId/submit", eventSubmission_controller_1.submitEventForVerification);
router.post("/verify-email-otp", eventSubmission_controller_1.verifyEmailOtp);
router.post("/resend-email-otp", eventSubmission_controller_1.resendEmailOtp);
exports.default = router;
