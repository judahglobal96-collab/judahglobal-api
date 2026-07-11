import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ||
  'Judah Global Support <jgsupport@judahglobal.org>';

const resend = resendApiKey
  ? new Resend(resendApiKey)
  : null;

const PASSWORD_RESET_EXPIRY_MINUTES = 60;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function validateEmail(email: string): string {
  const normalizedEmail = String(email ?? '')
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    throw new Error(
      'A recipient email address is required.'
    );
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(normalizedEmail)) {
    throw new Error(
      'The recipient email address is invalid.'
    );
  }

  return normalizedEmail;
}

function validateResetUrl(resetUrl: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(resetUrl);
  } catch {
    throw new Error(
      'The password reset URL is invalid.'
    );
  }

  if (
    process.env.NODE_ENV === 'production' &&
    parsedUrl.protocol !== 'https:'
  ) {
    throw new Error(
      'Password reset URLs must use HTTPS in production.'
    );
  }

  const resetToken =
    parsedUrl.searchParams.get('token');

  if (!resetToken) {
    throw new Error(
      'The password reset URL does not contain a reset token.'
    );
  }

  return parsedUrl.toString();
}

function buildPasswordResetText(
  resetUrl: string
): string {
  return [
    'Judah Global Password Reset',
    '',
    'We received a request to reset the password for your Judah Global account.',
    '',
    'Use the secure link below to create a new password:',
    resetUrl,
    '',
    `This link expires in ${PASSWORD_RESET_EXPIRY_MINUTES} minutes and can only be used once.`,
    '',
    'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.',
    '',
    'For your security, do not forward or share this link.',
    '',
    'Judah Global',
    "God's Love Distributed Globally",
  ].join('\n');
}

function buildPasswordResetHtml(
  resetUrl: string
): string {
  const safeResetUrl = escapeHtml(resetUrl);

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />
    <meta
      name="color-scheme"
      content="light only"
    />
    <meta
      name="supported-color-schemes"
      content="light only"
    />
    <title>Reset your Judah Global password</title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: Arial, Helvetica, sans-serif;
      color: #18181b;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width: 100%;
        background-color: #f4f4f5;
        padding: 32px 16px;
      "
    >
      <tr>
        <td align="center">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width: 100%;
              max-width: 600px;
              background-color: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
            "
          >
            <tr>
              <td
                align="center"
                style="
                  background-color: #111111;
                  padding: 30px 24px;
                "
              >
                <div
                  style="
                    color: #ffffff;
                    font-size: 25px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    line-height: 1.2;
                  "
                >
                  JUDAH GLOBAL
                </div>

                <div
                  style="
                    margin-top: 8px;
                    color: #d4d4d8;
                    font-size: 13px;
                    line-height: 1.5;
                  "
                >
                  God's Love Distributed Globally
                </div>
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding: 40px 36px 32px;
                "
              >
                <h1
                  style="
                    margin: 0 0 20px;
                    color: #18181b;
                    font-size: 26px;
                    font-weight: 700;
                    line-height: 1.3;
                  "
                >
                  Reset your password
                </h1>

                <p
                  style="
                    margin: 0 0 18px;
                    color: #3f3f46;
                    font-size: 16px;
                    line-height: 1.65;
                  "
                >
                  We received a request to reset the
                  password for your Judah Global account.
                </p>

                <p
                  style="
                    margin: 0 0 28px;
                    color: #3f3f46;
                    font-size: 16px;
                    line-height: 1.65;
                  "
                >
                  Select the button below to create a new
                  password.
                </p>

                <table
                  role="presentation"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    margin: 0 auto 30px;
                  "
                >
                  <tr>
                    <td
                      align="center"
                      bgcolor="#111111"
                      style="
                        border-radius: 7px;
                      "
                    >
                      <a
                        href="${safeResetUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                          display: inline-block;
                          padding: 15px 28px;
                          color: #ffffff;
                          font-size: 16px;
                          font-weight: 700;
                          line-height: 1;
                          text-decoration: none;
                          border-radius: 7px;
                        "
                      >
                        Reset Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p
                  style="
                    margin: 0 0 18px;
                    color: #71717a;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  This secure link expires in
                  <strong>
                    ${PASSWORD_RESET_EXPIRY_MINUTES} minutes
                  </strong>
                  and can only be used once.
                </p>

                <p
                  style="
                    margin: 0 0 24px;
                    color: #71717a;
                    font-size: 14px;
                    line-height: 1.6;
                  "
                >
                  If you did not request a password reset,
                  you can safely ignore this email. Your
                  password will remain unchanged.
                </p>

                <div
                  style="
                    margin-top: 28px;
                    padding-top: 24px;
                    border-top: 1px solid #e4e4e7;
                  "
                >
                  <p
                    style="
                      margin: 0 0 10px;
                      color: #71717a;
                      font-size: 12px;
                      line-height: 1.6;
                    "
                  >
                    If the button does not work, copy and
                    paste this URL into your browser:
                  </p>

                  <p
                    style="
                      margin: 0;
                      word-break: break-all;
                      color: #52525b;
                      font-size: 12px;
                      line-height: 1.6;
                    "
                  >
                    <a
                      href="${safeResetUrl}"
                      target="_blank"
                      rel="noopener noreferrer"
                      style="
                        color: #52525b;
                        text-decoration: underline;
                      "
                    >
                      ${safeResetUrl}
                    </a>
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td
                align="center"
                style="
                  background-color: #fafafa;
                  padding: 22px 24px;
                  border-top: 1px solid #e4e4e7;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #71717a;
                    font-size: 12px;
                    line-height: 1.5;
                  "
                >
                  This is an automated security email from
                  Judah Global. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * Sends a secure Judah Global password reset email
 * through Resend.
 *
 * Do not log the reset URL or token in this service.
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  if (!resend) {
    throw new Error(
      'RESEND_API_KEY is not configured.'
    );
  }

  const normalizedEmail = validateEmail(email);
  const validatedResetUrl =
    validateResetUrl(resetUrl);

  const { error } = await resend.emails.send({
    from: resendFromEmail,
    to: normalizedEmail,
    subject: 'Reset your Judah Global password',
    text: buildPasswordResetText(
      validatedResetUrl
    ),
    html: buildPasswordResetHtml(
      validatedResetUrl
    ),
  });

  if (error) {
    throw new Error(
      error.message ||
        'Failed to send password reset email.'
    );
  }
}