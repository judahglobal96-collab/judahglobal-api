import { Router } from 'express';
import {
  createAdminOrganizationAccount,
  deleteAdminOrganizationAccount,
  getAdminOrganizationAccountById,
  getAdminOrganizationAccounts,
  updateAdminOrganizationAccount,
  updateAdminOrganizationAccountStatus,
  publicRegisterOrganization,

  // ✅ NEW
  getMyOrganizationAccount,
  getOrganizationAccountByUuidForPortal,
} from './orgAccounts.controller';

import { requireAuth } from '../../../middleware/auth.middleware';
import { requireRole } from '../../../middleware/auth.middleware';

const router = Router();

/**
 * =========================================
 * PUBLIC / USER ORG ROUTES
 * =========================================
 */

// Register organization (user must be logged in)
    router.post(
      "/public-register",
      requireAuth,
      publicRegisterOrganization
    );

// Get current user's organization
router.get('/me', requireAuth, getMyOrganizationAccount);

// Get organization by UUID (admin OR owner)
router.get('/:orgUuid', requireAuth, getOrganizationAccountByUuidForPortal);

/**
 * =========================================
 * ADMIN ROUTES
 * =========================================
 */

router.use(requireAuth);
router.use(requireRole('admin', 'sysadmin', 'execsysadmin'));

router.get('/', getAdminOrganizationAccounts);
router.get('/:orgId', getAdminOrganizationAccountById);
router.post('/', createAdminOrganizationAccount);
router.patch('/:orgId', updateAdminOrganizationAccount);
router.patch('/:orgId/status', updateAdminOrganizationAccountStatus);
router.delete('/:orgId', deleteAdminOrganizationAccount);

export default router;