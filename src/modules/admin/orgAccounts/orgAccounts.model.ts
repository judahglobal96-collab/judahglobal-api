import { db } from "../../../config/db";

export type OrgAccountStatus = "pending" | "active" | "suspended" | "rejected";
export type OrgVerificationStatus = "unverified" | "verified";

export interface OrganizationAccount {
  id: number;
  org_uuid: string;
  organization_name: string;
  organization_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  street_address: string | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  website_url: string | null;
  instagram_url: string | null;
  logo_url: string | null;
  logo_source: string | null;
  status: OrgAccountStatus;
  verification_status: OrgVerificationStatus;
  owner_user_id: string | null;
  created_by_admin_id: string | null;
  notes: string | null;

  subscription_region: string | null;
  subscription_price_cents: number | null;
  subscription_currency: string | null;
  subscription_status: string | null;
  subscription_checkout_session_id: string | null;
  subscription_payment_intent_id: string | null;
  subscription_started_at: string | null;
  subscription_expires_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationAccountInput {
  organization_name: string;
  organization_type?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_region?: string | null;
  country?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  logo_url?: string | null;
  logo_source?: string | null;
  status?: OrgAccountStatus;
  verification_status?: OrgVerificationStatus;
  owner_user_id?: string | null;
  created_by_admin?: boolean;
  created_by_admin_id?: string | null;
  notes?: string | null;
}

export interface UpdateOrganizationAccountInput {
  organization_name?: string;
  organization_type?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  street_address?: string | null;
  city?: string | null;
  state_region?: string | null;
  country?: string | null;
  website_url?: string | null;
  instagram_url?: string | null;
  logo_url?: string | null;
  logo_source?: string | null;
  status?: OrgAccountStatus;
  verification_status?: OrgVerificationStatus;
  owner_user_id?: string | null;
  notes?: string | null;
}

const allowedStatuses: OrgAccountStatus[] = [
  "pending",
  "active",
  "suspended",
  "rejected",
];

const allowedVerificationStatuses: OrgVerificationStatus[] = [
  "unverified",
  "verified",
];

const baseSelect = `
  SELECT
    oa.id,
    oa.org_uuid,
    oa.organization_name,
    oa.organization_type,
    oa.contact_name,
    oa.contact_email,
    oa.contact_phone,
    oa.street_address,
    oa.city,
    oa.state_region,
    oa.country,
    oa.website_url,
    oa.instagram_url,
    oa.logo_url,
    oa.logo_source,
    oa.status,
    oa.verification_status,
    oa.owner_user_id,
    oa.created_by_admin_id,
    oa.notes,
    oa.subscription_region,
    oa.subscription_price_cents,
    oa.subscription_currency,
    oa.subscription_status,
    oa.subscription_checkout_session_id,
    oa.subscription_payment_intent_id,
    oa.subscription_started_at,
    oa.subscription_expires_at,
    oa.created_at,
    oa.updated_at
  FROM organization_accounts oa
`;

const returningFields = `
  id,
  org_uuid,
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
  owner_user_id,
  created_by_admin_id,
  notes,
  subscription_region,
  subscription_price_cents,
  subscription_currency,
  subscription_status,
  subscription_checkout_session_id,
  subscription_payment_intent_id,
  subscription_started_at,
  subscription_expires_at,
  created_at,
  updated_at
`;

export async function listOrganizationAccounts(params: {
  status?: string;
  search?: string;
}) {
  const values: any[] = [];
  const where: string[] = [];

  if (params.status && allowedStatuses.includes(params.status as OrgAccountStatus)) {
    values.push(params.status);
    where.push(`oa.status = $${values.length}`);
  }

  if (params.search?.trim()) {
    values.push(`%${params.search.trim()}%`);
    where.push(`(
      oa.organization_name ILIKE $${values.length}
      OR COALESCE(oa.contact_name, '') ILIKE $${values.length}
      OR COALESCE(oa.contact_email, '') ILIKE $${values.length}
      OR COALESCE(oa.street_address, '') ILIKE $${values.length}
      OR COALESCE(oa.city, '') ILIKE $${values.length}
      OR COALESCE(oa.state_region, '') ILIKE $${values.length}
      OR COALESCE(oa.country, '') ILIKE $${values.length}
    )`);
  }

  const sql = `
    ${baseSelect}
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY oa.created_at DESC
  `;

  const result = await db.query(sql, values);
  return result.rows;
}

export async function getOrganizationAccountById(id: string | number) {
  const sql = `
    ${baseSelect}
    WHERE oa.id = $1
    LIMIT 1
  `;

  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

export async function getOrganizationAccountByOwnerUserId(ownerUserId: string) {
  const sql = `
    ${baseSelect}
    WHERE oa.owner_user_id = $1
    ORDER BY oa.created_at DESC
    LIMIT 1
  `;

  const result = await db.query(sql, [ownerUserId]);
  return result.rows[0] || null;
}

export async function getOrganizationAccountByUuid(orgUuid: string) {
  const sql = `
    ${baseSelect}
    WHERE oa.org_uuid = $1
    LIMIT 1
  `;

  const result = await db.query(sql, [orgUuid]);
  return result.rows[0] || null;
}

export async function createOrganizationAccount(
  input: CreateOrganizationAccountInput
) {
  const status =
    input.status && allowedStatuses.includes(input.status)
      ? input.status
      : "pending";

  const verificationStatus =
    input.verification_status &&
    allowedVerificationStatuses.includes(input.verification_status)
      ? input.verification_status
      : "unverified";

  const sql = `
    INSERT INTO organization_accounts (
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
      owner_user_id,
      created_by_admin_id,
      notes
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15, $16, $17, $18
    )
    RETURNING
      ${returningFields}
  `;

  const values = [
    input.organization_name.trim(),
    input.organization_type ?? null,
    input.contact_name ?? null,
    input.contact_email ?? null,
    input.contact_phone ?? null,
    input.street_address ?? null,
    input.city ?? null,
    input.state_region ?? null,
    input.country ?? null,
    input.website_url ?? null,
    input.instagram_url ?? null,
    input.logo_url ?? null,
    input.logo_source ?? "event_submission",
    status,
    verificationStatus,
    input.owner_user_id ?? null,
    input.created_by_admin_id ?? null,
    input.notes ?? null,
  ];

  const result = await db.query(sql, values);
  return result.rows[0];
}

export async function updateOrganizationAccount(
  id: string | number,
  input: UpdateOrganizationAccountInput
) {
  const fields: string[] = [];
  const values: any[] = [];

  const pushField = (column: string, value: any) => {
    values.push(value);
    fields.push(`${column} = $${values.length}`);
  };

  if (typeof input.organization_name === "string") {
    pushField("organization_name", input.organization_name.trim());
  }
  if ("organization_type" in input) {
    pushField("organization_type", input.organization_type ?? null);
  }
  if ("contact_name" in input) {
    pushField("contact_name", input.contact_name ?? null);
  }
  if ("contact_email" in input) {
    pushField("contact_email", input.contact_email ?? null);
  }
  if ("contact_phone" in input) {
    pushField("contact_phone", input.contact_phone ?? null);
  }
  if ("street_address" in input) {
    pushField("street_address", input.street_address ?? null);
  }
  if ("city" in input) {
    pushField("city", input.city ?? null);
  }
  if ("state_region" in input) {
    pushField("state_region", input.state_region ?? null);
  }
  if ("country" in input) {
    pushField("country", input.country ?? null);
  }
  if ("website_url" in input) {
    pushField("website_url", input.website_url ?? null);
  }
  if ("instagram_url" in input) {
    pushField("instagram_url", input.instagram_url ?? null);
  }
  if ("logo_url" in input) {
    pushField("logo_url", input.logo_url ?? null);
  }
  if ("logo_source" in input) {
    pushField("logo_source", input.logo_source ?? null);
  }
  if ("owner_user_id" in input) {
    pushField("owner_user_id", input.owner_user_id ?? null);
  }

  if (input.status && allowedStatuses.includes(input.status)) {
    pushField("status", input.status);
  }

  if (
    input.verification_status &&
    allowedVerificationStatuses.includes(input.verification_status)
  ) {
    pushField("verification_status", input.verification_status);
  }

  if ("notes" in input) {
    pushField("notes", input.notes ?? null);
  }

  if (!fields.length) {
    return getOrganizationAccountById(id);
  }

  values.push(id);

  const sql = `
    UPDATE organization_accounts
    SET
      ${fields.join(", ")},
      updated_at = NOW()
    WHERE id = $${values.length}
    RETURNING
      ${returningFields}
  `;

  const result = await db.query(sql, values);
  return result.rows[0] || null;
}

export async function updateOrganizationAccountStatus(
  id: string | number,
  status: OrgAccountStatus
) {
  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid organization account status");
  }

  const sql = `
    UPDATE organization_accounts
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING
      ${returningFields}
  `;

  const result = await db.query(sql, [status, id]);
  return result.rows[0] || null;
}

export async function deleteOrganizationAccount(id: string | number) {
  const sql = `DELETE FROM organization_accounts WHERE id = $1 RETURNING id`;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}