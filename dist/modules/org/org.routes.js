"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const org_controller_1 = require("./org.controller");
const orgAccounts_controller_1 = require("../admin/orgAccounts/orgAccounts.controller");
const orgEventSubmission_controller_1 = require("../../controllers/orgEventSubmission.controller");
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => {
    return res.status(200).json({
        success: true,
        message: "Org routes are mounted",
    });
});
router.get("/me", auth_middleware_1.requireAuth, org_controller_1.getMyOrganization);
router.get("/:orgUuid/approved-events", auth_middleware_1.requireAuth, org_controller_1.getOrgApprovedEvents);
router.post("/:orgUuid/submit-event/review", auth_middleware_1.requireAuth, orgEventSubmission_controller_1.submitEventForReview);
router.get("/:orgUuid/events/:eventId/edit", auth_middleware_1.requireAuth, org_controller_1.getOrgEventMetadataForEdit);
router.patch("/:orgUuid/events/:eventId/metadata", auth_middleware_1.requireAuth, org_controller_1.updateOrgEventMetadata);
router.get("/:orgUuid", auth_middleware_1.requireAuth, orgAccounts_controller_1.getOrganizationAccountByUuidForPortal);
exports.default = router;
