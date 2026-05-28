import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/auth.middleware';

// (we will create these next)
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from '../controllers/adminUsers.controller';

const router = Router();

// All admin routes require auth + role
router.use(requireAuth, requireRole('sysadmin', 'execsysadmin'));

// GET all users (admin + exec)
router.get('/users', getAllUsers);

// shared admin status route
router.patch('/users/:id/status', updateUserStatus);

// EXEC ONLY routes
router.patch(
  '/users/:id/role',
  requireRole('execsysadmin'),
  updateUserRole
);

export default router;