"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orgAccounts_controller_1 = require("./orgAccounts.controller");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const requireRole_1 = require("../../../middleware/requireRole");
const router = (0, express_1.Router)();
/**
 * =========================================
 * PUBLIC / USER ORG ROUTES
 * =========================================
 */
// Register organization (user must be logged in)
router.post('/public-register', orgAccounts_controller_1.publicRegisterOrganization);
// Get current user's organization
router.get('/me', auth_middleware_1.requireAuth, orgAccounts_controller_1.getMyOrganizationAccount);
// Get organization by UUID (admin OR owner)
router.get('/:orgUuid', auth_middleware_1.requireAuth, orgAccounts_controller_1.getOrganizationAccountByUuidForPortal);
/**
 * =========================================
 * ADMIN ROUTES
 * =========================================
 */
router.use(auth_middleware_1.requireAuth);
router.use((0, requireRole_1.requireRole)('admin', 'sysadmin', 'execsysadmin'));
router.get('/', orgAccounts_controller_1.getAdminOrganizationAccounts);
router.get('/:orgId', orgAccounts_controller_1.getAdminOrganizationAccountById);
router.post('/', orgAccounts_controller_1.createAdminOrganizationAccount);
router.patch('/:orgId', orgAccounts_controller_1.updateAdminOrganizationAccount);
router.patch('/:orgId/status', orgAccounts_controller_1.updateAdminOrganizationAccountStatus);
router.delete('/:orgId', orgAccounts_controller_1.deleteAdminOrganizationAccount);
exports.default = router;
