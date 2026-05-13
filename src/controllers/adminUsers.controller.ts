import { Request, Response } from 'express';
import {
  findPlatformUserById,
  getAllPlatformUsers,
  updatePlatformUserRole,
  updatePlatformUserStatus,
  countExecSysAdmins,
} from '../models/platform-user.model';

    const ALLOWED_ROLES = ['user', 'sysadmin', 'execsysadmin'];

export async function getAllUsers(req: Request, res: Response) {
  try {
    const email = typeof req.query.email === 'string' ? req.query.email.trim() : undefined;

    const users = await getAllPlatformUsers(email);

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({
      message: 'Failed to load users.',
    });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    const authUser = (req as any).user;
    const targetUserId = String(req.params.id);
    const { role } = req.body;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        message: 'User id is required.',
      });
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        message: 'Valid role is required.',
      });
    }

    const targetUser = await findPlatformUserById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: 'Target user not found.',
      });
    }

    if (authUser.role === 'sysadmin') {
      return res.status(403).json({
        message: 'Only execsysadmin can change user roles.',
      });
    }

    if (authUser.id === targetUserId && role !== 'execsysadmin') {
      return res.status(403).json({
        message: 'You cannot change your own role to a lower permission level.',
      });
    }

    if (targetUser.role === 'execsysadmin' && role !== 'execsysadmin') {
      const execCount = await countExecSysAdmins();

      if (execCount <= 1) {
        return res.status(403).json({
          message: 'The last active execsysadmin cannot be demoted.',
        });
      }
    }

    const updatedUser = await updatePlatformUserRole(targetUserId, role);

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Failed to update user role.',
      });
    }

    return res.status(200).json({
      message: 'User role updated successfully.',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error('updateUserRole error:', error);
    return res.status(500).json({
      message: 'Failed to update user role.',
    });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    const authUser = (req as any).user;
    const targetUserId = String(req.params.id);
    const { is_active } = req.body;

    if (!authUser?.id) {
      return res.status(401).json({
        message: 'Unauthorized.',
      });
    }

    if (!targetUserId) {
      return res.status(400).json({
        message: 'User id is required.',
      });
    }

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        message: 'Valid is_active boolean is required.',
      });
    }

    const targetUser = await findPlatformUserById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: 'Target user not found.',
      });
    }

    if (
      authUser.role === 'sysadmin' &&
      (targetUser.role === 'sysadmin' || targetUser.role === 'execsysadmin')
    ) {
      return res.status(403).json({
        message: 'Sysadmin cannot change status for admin-level accounts.',
      });
    }

    if (targetUser.role === 'execsysadmin' && is_active === false) {
      const execCount = await countExecSysAdmins();

      if (execCount <= 1) {
        return res.status(403).json({
          message: 'The last active execsysadmin cannot be deactivated.',
        });
      }
    }

    const updatedUser = await updatePlatformUserStatus(targetUserId, is_active);

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Failed to update user status.',
      });
    }

    return res.status(200).json({
      message: `User ${is_active ? 'reactivated' : 'deactivated'} successfully.`,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error('updateUserStatus error:', error);
    return res.status(500).json({
      message: 'Failed to update user status.',
    });
  }
}