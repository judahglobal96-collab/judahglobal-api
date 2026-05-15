"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const requireRole_1 = require("../middleware/requireRole");
// (we will create these next)
const adminUsers_controller_1 = require("../controllers/adminUsers.controller");
const router = (0, express_1.Router)();
// All admin routes require auth + role
router.use(auth_middleware_1.requireAuth, (0, requireRole_1.requireRole)('sysadmin', 'execsysadmin'));
// GET all users (admin + exec)
router.get('/users', adminUsers_controller_1.getAllUsers);
// shared admin status route
router.patch('/users/:id/status', adminUsers_controller_1.updateUserStatus);
// EXEC ONLY routes
router.patch('/users/:id/role', (0, requireRole_1.requireRole)('execsysadmin'), adminUsers_controller_1.updateUserRole);
exports.default = router;
