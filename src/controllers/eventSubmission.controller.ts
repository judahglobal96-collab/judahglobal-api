import { Response } from "express";
import { db } from "../config/db";
import { v4 as uuidv4 } from "uuid";
import { isValidEventType } from "../lib/event-options";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOtpExpiresAt(): Date {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 10);
  return expires;
}

export const createDraftEvent = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const requestedOwnerUserId = req.user?.id ?? null;

    const orgUuid =
      req.params.orgUuid ||
      req.body.org_uuid ||
      req.body.orgUuid ||
      null;

    const eventId = uuidv4();

    const {
      title,
      description,
      event_type,
      submitter_email,
      submitter_name,
      submitter_phone,
    } = req.body;

    if (!title || !description || !event_type || !submitter_email) {
      return res.status(400).json({
        error: "title, description, event_type, and submitter_email are required",
      });
    }

    if (!isValidEventType(event_type)) {
      return res.status(400).json({
        error: "Invalid event type",
      });
    }

    const insertDraft = async (ownerUserId: string | null) => {
      return db.query(
        `
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
        `,
        [
          eventId,
          title,
          description,
          event_type,
          submitter_email,
          submitter_name ?? null,
          submitter_phone ?? null,
          ownerUserId,
          orgUuid,
        ]
      );
    };

    try {
      await insertDraft(requestedOwnerUserId);
    } catch (error: any) {
      if (
        error?.code === "23503" &&
        error?.constraint === "event_submissions_owner_user_id_fkey"
      ) {
        console.warn(
          "owner_user_id FK failed. Retrying draft creation as public submission.",
          {
            requestedOwnerUserId,
            constraint: error?.constraint,
          }
        );

        await insertDraft(null);
      } else {
        throw error;
      }
    }

    return res.status(201).json({
      success: true,
      event_id: eventId,
      status: "draft",
      org_uuid: orgUuid,
      owner_user_id: requestedOwnerUserId,
      message: "Draft event created",
    });
  } catch (error: any) {
    console.error("createDraftEvent error:", error);

    return res.status(500).json({
      error: "Failed to create event draft",
      detail: error?.message,
      code: error?.code,
      constraint: error?.constraint,
    });
  }
};

export async function submitEventForVerification(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const eventId = req.params.eventId;

    if (!eventId) {
      return res.status(400).json({ error: "Missing event ID" });
    }

    const orgUuid =
      req.params.orgUuid ||
      req.body.org_uuid ||
      req.body.orgUuid ||
      null;

    if (orgUuid) {
      await db.query(
        `
        UPDATE event_submissions
        SET org_uuid = COALESCE(org_uuid, $2::uuid),
            updated_at = NOW()
        WHERE id = $1::uuid
        `,
        [eventId, orgUuid]
      );
    }

    const submissionResult = await db.query(
      `
      SELECT *
      FROM event_submissions
      WHERE id = $1
      `,
      [eventId]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({ error: "Event not found" });
    }

    const submission = submissionResult.rows[0];

    if (
      !submission.title ||
      !submission.description ||
      !submission.event_type ||
      !submission.submitter_email
    ) {
      return res.status(400).json({
        error:
          "Event is incomplete. Please complete all required fields before submitting.",
      });
    }

    if (!isValidEventType(submission.event_type)) {
      return res.status(400).json({
        error: "Invalid event type",
      });
    }

    const otpCode = generateOtpCode();
    const otpExpiresAt = getOtpExpiresAt();

    await db.query(
      `
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
      `,
      [uuidv4(), submission.id, submission.submitter_email, otpCode, otpExpiresAt]
    );

    await db.query(
      `
      UPDATE event_submissions
      SET
        otp_code = $1,
        otp_expires_at = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [otpCode, otpExpiresAt, eventId]
    );

    return res.status(200).json({
      success: true,
      message: "Verification code sent",
      submissionId: submission.id,
      email: submission.submitter_email,
      status: "draft",
      org_uuid: submission.org_uuid,
    });
  } catch (error) {
    console.error("submitEventForVerification error:", error);
    return res.status(500).json({
      error: "Failed to send verification code",
    });
  }
}

export async function verifyEmailOtp(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { eventId, submissionId, code, org_uuid, orgUuid } = req.body;
    const resolvedEventId = eventId || submissionId;

    if (!resolvedEventId || !code) {
      return res.status(400).json({
        error: "submissionId/eventId and code are required",
      });
    }

    const resolvedOrgUuid =
      req.params.orgUuid ||
      org_uuid ||
      orgUuid ||
      null;

    if (resolvedOrgUuid) {
      await db.query(
        `
        UPDATE event_submissions
        SET org_uuid = COALESCE(org_uuid, $2::uuid),
            updated_at = NOW()
        WHERE id = $1::uuid
        `,
        [resolvedEventId, resolvedOrgUuid]
      );
    }

    const verificationResult = await db.query(
      `
      SELECT *
      FROM event_verifications
      WHERE event_id = $1
        AND otp_code = $2
        AND expires_at > NOW()
        AND verified = false
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [resolvedEventId, code]
    );

    if (verificationResult.rows.length === 0) {
      return res.status(400).json({
        error: "Invalid or expired OTP",
      });
    }

    await db.query(
      `
      UPDATE event_verifications
      SET verified = true,
          consumed_at = NOW()
      WHERE id = $1
      `,
      [verificationResult.rows[0].id]
    );

    await db.query(
      `
      UPDATE event_submissions
      SET status = 'pending',
          updated_at = NOW()
      WHERE id = $1
      `,
      [resolvedEventId]
    );

    return res.json({
      success: true,
      verified: true,
      message: "Email verified. Event submitted for review.",
    });
  } catch (error) {
    console.error("verifyEventOTP error:", error);
    return res.status(500).json({
      error: "OTP verification failed",
    });
  }
}

export async function resendEmailOtp(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { submissionId, email } = req.body;

    if (!submissionId || !email) {
      return res.status(400).json({
        error: "submissionId and email are required",
      });
    }

    const submissionResult = await db.query(
      `
      SELECT *
      FROM event_submissions
      WHERE id = $1
        AND submitter_email = $2
      `,
      [submissionId, email]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        error: "Submission not found",
      });
    }

    const submission = submissionResult.rows[0];
    const otpCode = generateOtpCode();
    const otpExpiresAt = getOtpExpiresAt();

    await db.query(
      `
      UPDATE event_submissions
      SET
        otp_code = $1,
        otp_expires_at = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [otpCode, otpExpiresAt, submission.id]
    );

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent.",
    });
  } catch (error) {
    console.error("resendEmailOtp error:", error);
    return res.status(500).json({
      error: "Failed to resend verification code",
    });
  }
}
export const uploadEventMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(400).json({
        error: "Missing event ID",
      });
    }

    // multer puts uploaded file here
    const file = (req as any).file || (req as any).files?.[0];
    if (!file) {
      return res.status(400).json({
        error: "No media file uploaded",
      });
    }

    // OPTIONAL:
    // replace with your actual storage URL logic later
    const mediaUrl = file.path || file.location || file.filename;

    await db.query(
      `
      INSERT INTO event_media (
        id,
        event_id,
        media_type,
        media_url,
        created_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [
        uuidv4(),
        eventId,
        file.mimetype,
        mediaUrl,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      url: mediaUrl,
      media_url: mediaUrl,
    });
  } catch (error: any) {
    console.error("uploadEventMedia error:", error);

    return res.status(500).json({
      error: "Failed to upload media",
      detail: error?.message,
    });
  }
};