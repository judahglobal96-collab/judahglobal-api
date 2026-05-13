import nodemailer from "nodemailer";
import { db } from "../config/db";
import { buildNewEventsEmail } from "../lib/emailTemplates/newEventsEmailTemplate";

type NotificationUser = {
  user_id: string;
  email: string;
  first_name: string | null;
  city: string | null;
  state_region: string | null;
  preferred_city: string | null;
  preferred_state_region: string | null;
  max_event_cards: number;
};

type NotificationEvent = {
  event_id: string;
  event_code: string;
  title: string;
  short_description: string | null;
  city: string | null;
  state_region: string | null;
  country: string | null;
  starts_at_utc: string;
  occurrence_date: string;
  is_featured: boolean;
  is_major_event: boolean;
  media_url: string | null;
};

const APP_URL = process.env.APP_URL || "http://localhost:5173";
const FROM_EMAIL =
  process.env.NOTIFICATION_FROM_EMAIL || "Judah Global <no-reply@judahglobal.com>";

function formatEventDate(dateValue: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateValue));
}

function eventUrl(eventCode: string) {
  return `${APP_URL}/events/${eventCode}`;
}

function buildEventCard(event: NotificationEvent) {
  const badge = event.is_major_event
    ? "👑 MAJOR EVENT"
    : event.is_featured
      ? "⭐ FEATURED"
      : "JUDAH GLOBAL EVENT";

  const imageUrl =
    event.media_url ||
    "https://via.placeholder.com/800x450/050505/d4af37?text=Judah+Global+Event";

  return `
    <td style="width:33.333%; padding:8px; vertical-align:top;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #d4af37;">
        <tr>
          <td style="background:#050505; padding:0; position:relative;">
            <div style="padding:10px 12px; color:#f4c542; font-weight:700; font-size:13px;">
              ${badge}
            </div>
            <img src="${imageUrl}" alt="${event.title}" width="100%" style="display:block; width:100%; height:160px; object-fit:cover;" />
          </td>
        </tr>
        <tr>
          <td style="padding:18px;">
            <h3 style="margin:0 0 10px; font-size:20px; line-height:1.15; color:#111111; font-family:Arial, sans-serif;">
              ${event.title}
            </h3>

            <p style="margin:0 0 8px; color:#222222; font-size:14px; font-family:Arial, sans-serif;">
              📅 ${formatEventDate(event.occurrence_date)}
            </p>

            <p style="margin:0 0 16px; color:#222222; font-size:14px; font-family:Arial, sans-serif;">
              📍 ${event.city || ""}${event.city && event.state_region ? ", " : ""}${event.state_region || ""}
            </p>

            <a href="${eventUrl(event.event_code)}"
              style="display:block; text-align:center; background:#050505; color:#f4c542; text-decoration:none; border:1px solid #d4af37; border-radius:8px; padding:12px 10px; font-weight:700; font-family:Arial, sans-serif;">
              VIEW EVENT →
            </a>
          </td>
        </tr>
      </table>
    </td>
  `;
}

function buildEmailHtml(user: NotificationUser, events: NotificationEvent[]) {
  const cards = events.map(buildEventCard).join("");

  return `
  <!doctype html>
  <html>
    <body style="margin:0; padding:0; background:#050505;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505;">
        <tr>
          <td align="center">
            <table role="presentation" width="960" cellpadding="0" cellspacing="0" style="max-width:960px; width:100%; background:#050505; color:#ffffff; font-family:Arial, sans-serif;">
              
              <tr>
                <td style="padding:20px 36px; border-bottom:1px solid #3a2a08;">
                  <span style="color:#ffffff;">New events have been posted in </span>
                  <span style="color:#f4c542;">your area.</span>
                  <a href="${APP_URL}" style="float:right; color:#f4c542; text-decoration:none;">View in Browser</a>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:44px 24px 20px;">
                  <h1 style="margin:0; color:#d4af37; font-size:52px; letter-spacing:4px;">JUDAH</h1>
                  <p style="margin:0 0 34px; color:#d4af37; font-size:20px; letter-spacing:8px;">GLOBAL</p>

                  <h2 style="margin:0; font-size:54px; line-height:1; color:#ffffff;">NEW EVENTS</h2>
                  <h2 style="margin:8px 0 24px; font-size:48px; line-height:1; color:#f4c542;">POSTED NEAR YOU</h2>

                  <p style="margin:0; color:#ffffff; font-size:20px; line-height:1.5;">
                    Check out some of the featured events<br />
                    happening in <span style="color:#f4c542;">your area.</span>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:18px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      ${cards}
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:20px 28px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4af37; border-radius:12px;">
                    <tr>
                      <td align="center" style="padding:24px;">
                        <div style="font-size:28px; font-weight:800; color:#ffffff;">
                          MORE EVENTS ARE AVAILABLE
                        </div>
                        <div style="font-size:32px; color:#f4c542; font-style:italic;">
                          in your area.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:10px 24px 44px;">
                  <p style="font-size:18px; color:#ffffff; line-height:1.5;">
                    Log in to Judah Global<br />
                    to explore even more events happening in your community and beyond.
                  </p>

                  <a href="${APP_URL}/events"
                    style="display:inline-block; background:#f4c542; color:#050505; text-decoration:none; border-radius:8px; padding:16px 42px; font-weight:800; font-size:20px;">
                    VIEW MORE EVENTS →
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding:26px 36px; border-top:1px solid #3a2a08;">
                  <table role="presentation" width="100%">
                    <tr>
                      <td style="color:#d4af37; font-size:28px; font-weight:800;">
                        JUDAH<br /><span style="font-size:16px; letter-spacing:5px;">GLOBAL</span>
                      </td>
                      <td style="color:#f4c542; font-size:16px;">
                        Uniting Communities.<br />
                        Elevating Kingdom Impact.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding:14px 24px 28px; color:#888888; font-size:12px;">
                  You are receiving this email because you are a registered user of Judah Global.<br />
                  Manage your email preferences in your
                  <a href="${APP_URL}/account/settings" style="color:#d4af37;">account settings</a>.
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

async function getEligibleUsers(): Promise<NotificationUser[]> {
  const result = await db.query(`
    SELECT
      pu.id AS user_id,
      pu.email,
      pu.first_name,
      pu.city,
      pu.state_region,
      unp.preferred_city,
      unp.preferred_state_region,
      COALESCE(unp.max_event_cards, 3) AS max_event_cards
    FROM platform_users pu
    INNER JOIN user_notification_preferences unp
      ON unp.user_id = pu.id
    WHERE pu.is_active = TRUE
      AND pu.is_email_verified = TRUE
      AND unp.email_enabled = TRUE
      AND unp.new_events_enabled = TRUE
      AND pu.email IS NOT NULL
  `);

  return result.rows;
}

async function getEventsForUser(user: NotificationUser): Promise<NotificationEvent[]> {
  const stateRegion = user.preferred_state_region || user.state_region;
  const city = user.preferred_city || user.city;
  const limit = user.max_event_cards || 3;

  if (!stateRegion) return [];

  const result = await db.query(
    `
    SELECT
      edi.event_id,
      edi.event_code,
      edi.title,
      edi.short_description,
      edi.city,
      edi.state_region,
      edi.country,
      edi.starts_at_utc,
      edi.occurrence_date,
      edi.is_featured,
      COALESCE(es.is_major_event, FALSE) AS is_major_event,
      edi.media_url
    FROM event_discovery_index edi
    LEFT JOIN event_submissions es
      ON es.id = edi.event_id
    WHERE edi.status = 'approved'
      AND edi.starts_at_utc > NOW()
      AND LOWER(edi.state_region) = LOWER($1)
    ORDER BY
      COALESCE(es.is_major_event, FALSE) DESC,
      edi.is_featured DESC,
      CASE
        WHEN $2::text IS NOT NULL AND LOWER(edi.city) = LOWER($2::text) THEN 0
        ELSE 1
      END ASC,
      edi.starts_at_utc ASC
    LIMIT $3
    `,
    [stateRegion, city, limit]
  );

  return result.rows;
}

async function sendEmail(to: string, subject: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendUserEventNotifications() {
  const users = await getEligibleUsers();

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const user of users) {
    try {
      const events = await getEventsForUser(user);

      if (events.length === 0) {
        skippedCount += 1;
        continue;
      }

      const html = buildNewEventsEmail(
      events.map((e) => ({
        title: e.title || "Judah Global Event",
        date: e.occurrence_date,
        city: e.city || "",
        state_region: e.state_region || "",
        image_url:
          e.media_url ||
          "https://via.placeholder.com/800x450/050505/d4af37?text=Judah+Global+Event",
        event_url: `${APP_URL}/events/${e.event_code}`,
        badge: e.is_major_event
          ? "MAJOR"
          : e.is_featured
          ? "FEATURED"
          : null,
      }))    
    );

      await sendEmail(
        user.email,
        "New Events Posted Near You | Judah Global",
        html
      );

      sentCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(
        `Failed to send notification email to user ${user.user_id}:`,
        error
      );
    }
  }

  return {
    sentCount,
    skippedCount,
    failedCount,
    totalUsersChecked: users.length,
  };
}