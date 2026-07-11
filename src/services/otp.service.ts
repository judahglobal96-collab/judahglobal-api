import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "Judah Global <no-reply@judahglobal.org>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i += 1) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
}

export async function sendOtpEmail(
  email: string,
  otpCode: string
): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: "Your Judah Global verification code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px; color: #111827;">
          Judah Global Verification
        </h2>

        <p style="font-size: 16px; color: #374151; line-height: 1.6;">
          Use the verification code below to complete your Judah Global sign-in or registration.
        </p>

        <div
          style="
            margin: 24px 0;
            padding: 18px;
            text-align: center;
            border-radius: 12px;
            background: #f3f4f6;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #111827;
          "
        >
          ${otpCode}
        </div>

        <p style="font-size: 14px; color: #6b7280;">
          This code expires in 10 minutes. If you did not request this code, you may ignore this email.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Failed to send OTP email.");
  }
}