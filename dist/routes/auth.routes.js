"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.registerPlatformUser);
router.post('/login', auth_controller_1.loginPlatformUser);
router.post('/verify-otp', auth_controller_1.verifyPlatformUserOtp);
router.get('/me', auth_middleware_1.requireAuth, auth_controller_1.getMe); // lightweight auth check
router.get('/me/profile', auth_middleware_1.requireAuth, auth_controller_1.getMyPlatformProfile); // full profile
router.patch('/me', auth_middleware_1.requireAuth, auth_controller_1.updateMyPlatformProfile);
exports.default = router;
