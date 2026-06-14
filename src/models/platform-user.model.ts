import { db } from '../config/db';

export interface PlatformUser {
  id: string;
  first_name: string;
  last_name: string;
  dob_month: number;
  dob_year: number;
  city: string | null;
  state_region: string | null;
  email: string;
  password_hash: string;
  role: 'user' | 'sysadmin' | 'execsysadmin';
  is_active: boolean;
  is_email_verified: boolean;
  two_factor_enabled: boolean;
  two_factor_code: string | null;
  two_factor_expires_at: string | null;
  password_reset_token_hash: string | null;
  password_reset_expires_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function createPlatformUser(input: {
  firstName: string;
  lastName: string;
  dobMonth: number;
  dobYear: number;
  city?: string;
  stateRegion?: string;
  email: string;
  passwordHash: string;
  role?: 'user' | 'sysadmin' | 'execsysadmin';
}) {
  const result = await db.query(
    `
    INSERT INTO platform_users (
      first_name,
      last_name,
      dob_month,
      dob_year,
      city,
      state_region,
      email,
      password_hash,
      role
    )
    VALUES ($1, $2, $3, $4, $5, $6, LOWER($7), $8, $9)
    RETURNING *
    `,
    [
      input.firstName,
      input.lastName,
      input.dobMonth,
      input.dobYear,
      input.city || null,
      input.stateRegion || null,
      input.email,
      input.passwordHash,
      input.role || 'user',
    ]
  );

  return result.rows[0] as PlatformUser;
}

export async function findPlatformUserByEmail(email: string) {
  const result = await db.query(
    `SELECT * FROM platform_users WHERE email = LOWER($1) LIMIT 1`,
    [email]
  );

  return result.rows[0] as PlatformUser | null;
}

export async function findPlatformUserById(id: string) {
  const result = await db.query(
    `SELECT * FROM platform_users WHERE id = $1 LIMIT 1`,
    [id]
  );

  return result.rows[0] as PlatformUser | null;
}

export async function setTwoFactorCode(
  userId: string,
  code: string,
  expiresAt: string
) {
  await db.query(
    `
    UPDATE platform_users
    SET
      two_factor_code = $2,
      two_factor_expires_at = $3
    WHERE id = $1
    `,
    [userId, code, expiresAt]
  );
}

export async function clearTwoFactorCode(userId: string) {
  await db.query(
    `
    UPDATE platform_users
    SET
      two_factor_code = NULL,
      two_factor_expires_at = NULL,
      last_login_at = NOW()
    WHERE id = $1
    `,
    [userId]
  );
}

export async function verifyPlatformUserEmail(userId: string) {
  await db.query(
    `
    UPDATE platform_users
    SET is_email_verified = true
    WHERE id = $1
    `,
    [userId]
  );
}

export async function setPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: string
) {
  await db.query(
    `
    UPDATE platform_users
    SET
      password_reset_token_hash = $2,
      password_reset_expires_at = $3,
      updated_at = NOW()
    WHERE id = $1
    `,
    [userId, tokenHash, expiresAt]
  );
}

export async function findPlatformUserByPasswordResetTokenHash(
  tokenHash: string
) {
  const result = await db.query(
    `
    SELECT *
    FROM platform_users
    WHERE password_reset_token_hash = $1
    LIMIT 1
    `,
    [tokenHash]
  );

  return result.rows[0] as PlatformUser | null;
}

export async function clearPasswordResetToken(userId: string) {
  await db.query(
    `
    UPDATE platform_users
    SET
      password_reset_token_hash = NULL,
      password_reset_expires_at = NULL,
      updated_at = NOW()
    WHERE id = $1
    `,
    [userId]
  );
}

export async function updatePlatformUserPassword(
  userId: string,
  passwordHash: string
) {
  const result = await db.query(
    `
    UPDATE platform_users
    SET
      password_hash = $2,
      password_reset_token_hash = NULL,
      password_reset_expires_at = NULL,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [userId, passwordHash]
  );

  return result.rows[0] as PlatformUser | null;
}

export async function updatePlatformUserProfile(
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    dobMonth: number;
    dobYear: number;
    city?: string;
    stateRegion?: string;
  }
) {
  const result = await db.query(
    `
    UPDATE platform_users
    SET
      first_name = $2,
      last_name = $3,
      dob_month = $4,
      dob_year = $5,
      city = $6,
      state_region = $7,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      userId,
      input.firstName,
      input.lastName,
      input.dobMonth,
      input.dobYear,
      input.city || null,
      input.stateRegion || null,
    ]
  );

  return result.rows[0] as PlatformUser | null;
}

export async function getAllPlatformUsers(email?: string) {
  const result = await db.query(
    `
    SELECT
      id,
      first_name,
      last_name,
      email,
      role,
      is_active,
      city,
      state_region,
      created_at,
      last_login_at
    FROM platform_users
    ORDER BY created_at DESC
    `
  );

  return result.rows;
}

export async function updatePlatformUserRole(id: string, role: string) {
  const result = await db.query(
    `
    UPDATE platform_users
    SET
      role = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      first_name,
      last_name,
      email,
      role,
      is_active,
      created_at
    `,
    [id, role]
  );

  return result.rows[0] || null;
}

export async function updatePlatformUserStatus(id: string, isActive: boolean) {
  const result = await db.query(
    `
    UPDATE platform_users
    SET
      is_active = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      first_name,
      last_name,
      email,
      role,
      is_active,
      created_at
    `,
    [id, isActive]
  );

  return result.rows[0] || null;
}

export async function countExecSysAdmins() {
  const result = await db.query(
    `
    SELECT COUNT(*)::int AS count
    FROM platform_users
    WHERE role = 'execsysadmin'
      AND is_active = true
    `
  );

  return result.rows[0]?.count ?? 0;
}
export async function findPlatformUserProfileById(id: string) {
  const result = await db.query(
    `
    SELECT
      pu.id,
      pu.first_name,
      pu.last_name,
      pu.dob_month,
      pu.dob_year,
      pu.city,
      pu.state_region,
      pu.email,
      pu.role,
      pu.is_active,
      pu.is_email_verified,
      pu.last_login_at,
      pu.created_at,
      pu.updated_at,
      oa.id AS organization_id,
      oa.org_uuid AS organization_uuid,
      oa.organization_name,
      oa.status AS organization_status,
      oa.subscription_status,
      CASE
        WHEN oa.id IS NOT NULL THEN true
        ELSE false
      END AS has_org_account
    FROM platform_users pu
    LEFT JOIN organization_accounts oa
      ON oa.owner_user_id = pu.id
    WHERE pu.id = $1
    LIMIT 1
    `,
    [id]
  );

  return result.rows[0] || null;
}