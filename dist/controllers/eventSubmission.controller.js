"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDraftEvent = void 0;
exports.submitEventForVerification = submitEventForVerification;
exports.verifyEmailOtp = verifyEmailOtp;
exports.resendEmailOtp = resendEmailOtp;
const db_1 = require("../config/db");
const uuid_1 = require("uuid");
const event_options_1 = require("../lib/event-options");
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function getOtpExpiresAt() {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);
    return expires;
}
const createDraftEvent = async (req, res) => {
    try {
        const ownerUserId = req.user?.id;
        if (!ownerUserId) {
            return res.status(401).json({
                error: "You must be logged in to submit an event.",
            });
        }
        const orgUuid = req.params.orgUuid ||
            req.body.org_uuid ||
            req.body.orgUuid ||
            null;
        console.log("CREATE DRAFT EVENT:", {
            ownerUserId,
            orgUuid,
            params: req.params,
            bodyOrgUuid: req.body?.org_uuid,
            bodyOrgUuidCamel: req.body?.orgUuid,
        });
        const eventId = (0, uuid_1.v4)();
        const { title, description, event_type, submitter_email, submitter_name, submitter_phone, } = req.body;
        if (!title || !description || !event_type || !submitter_email) {
            return res.status(400).json({
                error: "title, description, event_type, and submitter_email are required",
            });
        }
        if (!(0, event_options_1.isValidEventType)(event_type)) {
            return res.status(400).json({
                error: "Invalid event type",
            });
        }
        await db_1.db.query(`
      INSERT INTO event_submissions (
        id,
        title,
        description,
        event_type,
        submitter_email,
        submitter_name,
        submitter_phone,
        owner_user_id,
        org_uuid,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft')
      `, [
            eventId,
            title,
            description,
            event_type,
            submitter_email,
            submitter_name ?? null,
            submitter_phone ?? null,
            ownerUserId,
            orgUuid,
        ]);
        return res.status(201).json({
            success: true,
            event_id: eventId,
            status: "draft",
            org_uuid: orgUuid,
            message: "Draft event created",
        });
    }
    catch (error) {
        console.error("createDraftEvent error:", error);
        return res.status(500).json({
            error: "Failed to create event draft",
            detail: error?.message,
            code: error?.code,
            constraint: error?.constraint,
        });
    }
};
exports.createDraftEvent = createDraftEvent;
async function submitEventForVerification(req, res) {
    try {
        const eventId = req.params.eventId;
        if (!eventId) {
            return res.status(400).json({ error: "Missing event ID" });
        }
        const orgUuid = req.params.orgUuid ||
            req.body.org_uuid ||
            req.body.orgUuid ||
            null;
        if (orgUuid) {
            await db_1.db.query(`
        UPDATE event_submissions
        SET org_uuid = COALESCE(org_uuid, $2::uuid),
            updated_at = NOW()
        WHERE id = $1::uuid
        `, [eventId, orgUuid]);
        }
        const submissionResult = await db_1.db.query(`
      SELECT *
      FROM event_submissions
      WHERE id = $1
      `, [eventId]);
        if (submissionResult.rows.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        const submission = submissionResult.rows[0];
        if (!submission.title ||
            !submission.description ||
            !submission.event_type ||
            !submission.submitter_email) {
            return res.status(400).json({
                error: "Event is incomplete. Please complete all required fields before submitting.",
            });
        }
        if (!(0, event_options_1.isValidEventType)(submission.event_type)) {
            return res.status(400).json({
                error: "Invalid event type",
            });
        }
        const otpCode = generateOtpCode();
        const otpExpiresAt = getOtpExpiresAt();
        await db_1.db.query(`
      INSERT INTO event_verifications (
        id,
        event_id,
        email,
        otp_code,
        verified,
        expires_at,
        consumed_at,
        attempt_count,
        created_at
      )
      VALUES ($1, $2, $3, $4, false, $5, NULL, 0, NOW())
      `, [(0, uuid_1.v4)(), submission.id, submission.submitter_email, otpCode, otpExpiresAt]);
        await db_1.db.query(`
      UPDATE event_submissions
      SET
        otp_code = $1,
        otp_expires_at = $2,
        updated_at = NOW()
      WHERE id = $3
      `, [otpCode, otpExpiresAt, eventId]);
        return res.status(200).json({
            success: true,
            message: "Verification code sent",
            submissionId: submission.id,
            email: submission.submitter_email,
            status: "draft",
            org_uuid: submission.org_uuid,
        });
    }
    catch (error) {
        console.error("submitEventForVerification error:", error);
        return res.status(500).json({
            error: "Failed to send verification code",
        });
    }
}
async function verifyEmailOtp(req, res) {
    try {
        const { eventId, submissionId, code, org_uuid, orgUuid } = req.body;
        const resolvedEventId = eventId || submissionId;
        if (!resolvedEventId || !code) {
            return res.status(400).json({
                error: "submissionId/eventId and code are required",
            });
        }
        const resolvedOrgUuid = req.params.orgUuid ||
            org_uuid ||
            orgUuid ||
            null;
        if (resolvedOrgUuid) {
            await db_1.db.query(`
        UPDATE event_submissions
        SET org_uuid = COALESCE(org_uuid, $2::uuid),
            updated_at = NOW()
        WHERE id = $1::uuid
        `, [resolvedEventId, resolvedOrgUuid]);
        }
        const verificationResult = await db_1.db.query(`
      SELECT *
      FROM event_verifications
      WHERE event_id = $1
        AND otp_code = $2
        AND expires_at > NOW()
        AND verified = false
      ORDER BY created_at DESC
      LIMIT 1
      `, [resolvedEventId, code]);
        if (verificationResult.rows.length === 0) {
            return res.status(400).json({
                error: "Invalid or expired OTP",
            });
        }
        await db_1.db.query(`
      UPDATE event_verifications
      SET verified = true,
          consumed_at = NOW()
      WHERE id = $1
      `, [verificationResult.rows[0].id]);
        await db_1.db.query(`
      UPDATE event_submissions
      SET status = 'pending',
          updated_at = NOW()
      WHERE id = $1
      `, [resolvedEventId]);
        return res.json({
            success: true,
            verified: true,
            message: "Email verified. Event submitted for review.",
        });
    }
    catch (error) {
        console.error("verifyEventOTP error:", error);
        return res.status(500).json({
            error: "OTP verification failed",
        });
    }
}
async function resendEmailOtp(req, res) {
    try {
        const { submissionId, email } = req.body;
        if (!submissionId || !email) {
            return res.status(400).json({
                error: "submissionId and email are required",
            });
        }
        const submissionResult = await db_1.db.query(`
      SELECT *
      FROM event_submissions
      WHERE id = $1
        AND submitter_email = $2
      `, [submissionId, email]);
        if (submissionResult.rows.length === 0) {
            return res.status(404).json({
                error: "Submission not found",
            });
        }
        const submission = submissionResult.rows[0];
        const otpCode = generateOtpCode();
        const otpExpiresAt = getOtpExpiresAt();
        await db_1.db.query(`
      UPDATE event_submissions
      SET
        otp_code = $1,
        otp_expires_at = $2,
        updated_at = NOW()
      WHERE id = $3
      `, [otpCode, otpExpiresAt, submission.id]);
        return res.status(200).json({
            success: true,
            message: "A new verification code has been sent.",
        });
    }
    catch (error) {
        console.error("resendEmailOtp error:", error);
        return res.status(500).json({
            error: "Failed to resend verification code",
        });
    }
}
