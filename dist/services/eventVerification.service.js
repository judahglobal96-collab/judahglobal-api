"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventVerification = createEventVerification;
exports.verifyEventVerification = verifyEventVerification;
const db_1 = require("../config/db");
const otp_service_1 = require("./otp.service");
async function createEventVerification(eventId) {
    const sponsorResult = await db_1.db.query(`
    SELECT contact_email
    FROM event_sponsors
    WHERE event_id = $1
    LIMIT 1
    `, [eventId]);
    if (sponsorResult.rows.length === 0) {
        throw new Error("Sponsor not found for this event");
    }
    const email = sponsorResult.rows[0].contact_email;
    if (!email) {
        throw new Error("Sponsor contact email is missing");
    }
    const otp = (0, otp_service_1.generateOTP)();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db_1.db.query(`
    INSERT INTO event_verifications (
      event_id,
      email,
      otp_code,
      expires_at,
      verified,
      attempt_count
    )
    VALUES ($1, $2, $3, $4, false, 0)
    `, [eventId, email, otp, expiresAt]);
    return {
        eventId,
        email,
        otp,
        expiresAt,
    };
}
async function verifyEventVerification(eventId, code) {
    const verificationResult = await db_1.db.query(`
    SELECT *
    FROM event_verifications
    WHERE event_id = $1
      AND otp_code = $2
      AND expires_at > NOW()
      AND verified = false
    ORDER BY created_at DESC
    LIMIT 1
    `, [eventId, code]);
    if (verificationResult.rows.length === 0) {
        throw new Error("Invalid or expired OTP");
    }
    const verificationRow = verificationResult.rows[0];
    await db_1.db.query(`
    UPDATE event_verifications
    SET verified = true,
        consumed_at = NOW()
    WHERE id = $1
    `, [verificationRow.id]);
    await db_1.db.query(`
    UPDATE event_submissions
    SET status = 'pending',
        updated_at = NOW()
    WHERE event_id = $1
    `, [eventId]);
    return verificationRow;
}
