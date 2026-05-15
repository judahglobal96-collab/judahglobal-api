"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlatformUser = createPlatformUser;
exports.findPlatformUserByEmail = findPlatformUserByEmail;
exports.findPlatformUserById = findPlatformUserById;
exports.setTwoFactorCode = setTwoFactorCode;
exports.clearTwoFactorCode = clearTwoFactorCode;
exports.verifyPlatformUserEmail = verifyPlatformUserEmail;
exports.updatePlatformUserProfile = updatePlatformUserProfile;
exports.getAllPlatformUsers = getAllPlatformUsers;
exports.updatePlatformUserRole = updatePlatformUserRole;
exports.updatePlatformUserStatus = updatePlatformUserStatus;
exports.countExecSysAdmins = countExecSysAdmins;
const db_1 = require("../config/db");
async function createPlatformUser(input) {
    const result = await db_1.db.query(`
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
    `, [
        input.firstName,
        input.lastName,
        input.dobMonth,
        input.dobYear,
        input.city || null,
        input.stateRegion || null,
        input.email,
        input.passwordHash,
        input.role || 'user',
    ]);
    return result.rows[0];
}
async function findPlatformUserByEmail(email) {
    const result = await db_1.db.query(`SELECT * FROM platform_users WHERE email = LOWER($1) LIMIT 1`, [email]);
    return result.rows[0];
}
async function findPlatformUserById(id) {
    const result = await db_1.db.query(`SELECT * FROM platform_users WHERE id = $1 LIMIT 1`, [id]);
    return result.rows[0];
}
async function setTwoFactorCode(userId, code, expiresAt) {
    await db_1.db.query(`
    UPDATE platform_users
    SET two_factor_code = $2,
        two_factor_expires_at = $3
    WHERE id = $1
    `, [userId, code, expiresAt]);
}
async function clearTwoFactorCode(userId) {
    await db_1.db.query(`
    UPDATE platform_users
    SET two_factor_code = NULL,
        two_factor_expires_at = NULL,
        last_login_at = NOW()
    WHERE id = $1
    `, [userId]);
}
async function verifyPlatformUserEmail(userId) {
    await db_1.db.query(`
    UPDATE platform_users
    SET is_email_verified = true
    WHERE id = $1
    `, [userId]);
}
async function updatePlatformUserProfile(userId, input) {
    const result = await db_1.db.query(`
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
    `, [
        userId,
        input.firstName,
        input.lastName,
        input.dobMonth,
        input.dobYear,
        input.city || null,
        input.stateRegion || null,
    ]);
    return result.rows[0];
}
async function getAllPlatformUsers(email) {
    const result = await db_1.db.query(`
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
    `);
    return result.rows;
}
async function updatePlatformUserRole(id, role) {
    const result = await db_1.db.query(`
    UPDATE platform_users
    SET role = $2,
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
    `, [id, role]);
    return result.rows[0] || null;
}
async function updatePlatformUserStatus(id, isActive) {
    const result = await db_1.db.query(`
    UPDATE platform_users
    SET is_active = $2,
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
    `, [id, isActive]);
    return result.rows[0] || null;
}
async function countExecSysAdmins() {
    const result = await db_1.db.query(`
    SELECT COUNT(*)::int AS count
    FROM platform_users
    WHERE role = 'execsysadmin'
      AND is_active = true
    `);
    return result.rows[0]?.count ?? 0;
}
