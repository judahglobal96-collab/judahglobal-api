"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orgEventSubmission_controller_1 = require("../controllers/orgEventSubmission.controller");
const router = (0, express_1.Router)();
router.post("/submit-for-review", orgEventSubmission_controller_1.submitEventForReview);
exports.default = router;
