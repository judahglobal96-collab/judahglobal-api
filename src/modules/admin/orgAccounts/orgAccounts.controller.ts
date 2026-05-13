import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../../middleware/auth.middleware';
import {
  createOrganizationAccount,
  deleteOrganizationAccount,
  getOrganizationAccountById,
  getOrganizationAccountByOwnerUserId,
  getOrganizationAccountByUuid,
  listOrganizationAccounts,
  updateOrganizationAccount,
  updateOrganizationAccountStatus,
} from './orgAccounts.model';

function getSingleParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

export async function getAdminOrganizationAccounts(req: Request, res: Response) {
  try {
    const { status, search } = req.query;

    const rows = await listOrganizationAccounts({
      status: typeof status === 'string' ? status : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('getAdminOrganizationAccounts error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organization accounts',
    });
  }
}

export async function getAdminOrganizationAccountById(req: Request, res: Response) {
  try {
    const orgId = getSingleParam(req.params.orgId);

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId is required',
      });
    }

    const row = await getOrganizationAccountById(orgId);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Organization account not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: row,
    });
  } catch (error) {
    console.error('getAdminOrganizationAccountById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch organization account',
    });
  }
}

export async function getMyOrganizationAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const ownerUserId = req.user?.id;

    if (!ownerUserId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const organization = await getOrganizationAccountByOwnerUserId(ownerUserId);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    return res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('getMyOrganizationAccount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load organization',
    });
  }
}

export async function getOrganizationAccountByUuidForPortal(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const orgUuid = getSingleParam(req.params.orgUuid);

    if (!orgUuid) {
      return res.status(400).json({
        success: false,
        message: 'orgUuid is required',
      });
    }

    const organization = await getOrganizationAccountByUuid(orgUuid);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found',
      });
    }

    const userId = req.user?.id ?? null;
    const userRole = req.user?.role ?? null;

    const isAdmin =
      userRole === 'admin' ||
      userRole === 'sysadmin' ||
      userRole === 'execsysadmin';

    const isOwner = !!userId && organization.owner_user_id === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this organization portal',
      });
    }

    return res.status(200).json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('getOrganizationAccountByUuidForPortal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load organization',
    });
  }
}

export async function createAdminOrganizationAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      organization_name,
      organization_type,
      contact_name,
      contact_email,
      contact_phone,
      street_address,
      city,
      state_region,
      country,
      website_url,
      instagram_url,
      logo_url,
      logo_source,
      status,
      verification_status,
      notes,
    } = req.body ?? {};

    if (!organization_name || typeof organization_name !== 'string' || !organization_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'organization_name is required',
      });
    }

    const created = await createOrganizationAccount({
      organization_name,
      organization_type,
      contact_name,
      contact_email,
      contact_phone,
      street_address,
      city,
      state_region,
      country,
      website_url,
      instagram_url,
      logo_url,
      logo_source,
      status,
      verification_status,
      notes,
      owner_user_id: req.user?.id ?? null,
      created_by_admin: true,
      created_by_admin_id: req.user?.id ?? null,
    });

    return res.status(201).json({
      success: true,
      message: 'Organization account created successfully',
      data: created,
    });
  } catch (error) {
    console.error('createAdminOrganizationAccount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create organization account',
    });
  }
}

export async function updateAdminOrganizationAccount(req: Request, res: Response) {
  try {
    const orgId = getSingleParam(req.params.orgId);

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId is required',
      });
    }

    const existing = await getOrganizationAccountById(orgId);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Organization account not found',
      });
    }

    const updated = await updateOrganizationAccount(orgId, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Organization account updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('updateAdminOrganizationAccount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update organization account',
    });
  }
}

export async function updateAdminOrganizationAccountStatus(req: Request, res: Response) {
  try {
    const orgId = getSingleParam(req.params.orgId);

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId is required',
      });
    }

    const { status } = req.body ?? {};

    if (!status || typeof status !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'status is required',
      });
    }

    const updated = await updateOrganizationAccountStatus(orgId, status as any);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Organization account not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization account status updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('updateAdminOrganizationAccountStatus error:', error);

    if (error?.message === 'Invalid organization account status') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update organization account status',
    });
  }
}

export async function deleteAdminOrganizationAccount(req: Request, res: Response) {
  try {
    const orgId = getSingleParam(req.params.orgId);

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'orgId is required',
      });
    }

    const deleted = await deleteOrganizationAccount(orgId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Organization account not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Organization account deleted successfully',
    });
  } catch (error) {
    console.error('deleteAdminOrganizationAccount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete organization account',
    });
  }
}

export const publicRegisterOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      organization_name,
      organization_type,
      contact_name,
      email,
      phone,
      street_address,
      city,
      state_region,
      country,
    } = req.body ?? {};

    if (!organization_name || !contact_name || !email || !organization_type) {
      return res.status(400).json({
        success: false,
        message: 'organization_name, organization_type, contact_name, and email are required',
      });
    }

    const created = await createOrganizationAccount({
      organization_name,
      organization_type,
      contact_name,
      contact_email: email,
      contact_phone: phone ?? null,
      street_address: street_address ?? null,
      city: city ?? null,
      state_region: state_region ?? null,
      country: country ?? null,
      website_url: null,
      instagram_url: null,
      logo_url: null,
      logo_source: null,
      status: 'pending',
      verification_status: 'unverified',
      notes: 'Submitted from public registration form',
      owner_user_id: req.user?.id ?? null,
    });

    return res.status(201).json({
      success: true,
      message: 'Organization registered successfully',
      organization: created,
    });
  } catch (error) {
    console.error('publicRegisterOrganization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register organization',
    });
  }
};