import { db } from "../config/db";
import { generateOTP } from "./otp.service";

export async function createEventVerification(eventId: string) {
  const sponsorResult = await db.query(
    `
    SELECT contact_email
    FROM event_sponsors
    WHERE event_id = $1
    LIMIT 1
    `,
    [eventId]
  );

  if (sponsorResult.rows.length === 0) {
    throw new Error("Sponsor not found for this event");
  }

  const email = sponsorResult.rows[0].contact_email;

  if (!email) {
    throw new Error("Sponsor contact email is missing");
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.query(
    `
    INSERT INTO event_verifications (
      event_id,
      email,
      otp_code,
      expires_at,
      verified,
      attempt_count
    )
    VALUES ($1, $2, $3, $4, false, 0)
    `,
    [eventId, email, otp, expiresAt]
  );

  return {
    eventId,
    email,
    otp,
    expiresAt,
  };
}

export async function verifyEventVerification(eventId: string, code: string) {
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
    [eventId, code]
  );

  if (verificationResult.rows.length === 0) {
    throw new Error("Invalid or expired OTP");
  }

  const verificationRow = verificationResult.rows[0];

  await db.query(
    `
    UPDATE event_verifications
    SET verified = true,
        consumed_at = NOW()
    WHERE id = $1
    `,
    [verificationRow.id]
  );

  await db.query(
    `
    UPDATE event_submissions
    SET status = 'pending',
        updated_at = NOW()
    WHERE event_id = $1
    `,
    [eventId]
  );

  return verificationRow;
}