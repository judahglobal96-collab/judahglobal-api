type EventCard = {
  title: string;
  date: string;
  city: string;
  state_region: string;
  image_url: string;
  event_url: string;
  badge: "MAJOR" | "FEATURED" | null;
};

export function buildNewEventsEmail(events: EventCard[]) {
  const cards = events.map((event) => {
    const badgeLabel =
      event.badge === "MAJOR"
        ? "👑 MAJOR EVENT"
        : event.badge === "FEATURED"
        ? "⭐ FEATURED"
        : "";

    return `
      <td style="width:33%; padding:10px;">
        <table width="100%" style="background:#fff; border-radius:12px; overflow:hidden;">
          
          <tr>
            <td style="background:#000; color:#f4c542; padding:8px; font-size:12px;">
              ${badgeLabel}
            </td>
          </tr>

          <tr>
            <td>
              <img src="${event.image_url}" style="width:100%; height:160px; object-fit:cover;" />
            </td>
          </tr>

          <tr>
            <td style="padding:16px;">
              <h3 style="margin:0 0 10px; font-size:18px;">
                ${event.title}
              </h3>

              <p style="margin:0; font-size:14px;">
                📅 ${event.date}
              </p>

              <p style="margin:0 0 12px; font-size:14px;">
                📍 ${event.city}, ${event.state_region}
              </p>

              <a href="${event.event_url}"
                style="display:block; text-align:center; background:#000; color:#f4c542; padding:10px; border-radius:6px; text-decoration:none;">
                VIEW EVENT →
              </a>
            </td>
          </tr>

        </table>
      </td>
    `;
  });

  return `
  <html>
  <body style="margin:0; background:#000; color:#fff; font-family:Arial;">

    <div style="max-width:900px; margin:auto; padding:20px;">

      <h1 style="color:#d4af37;">JUDAH GLOBAL</h1>

      <h2 style="font-size:36px;">NEW EVENTS</h2>
      <h2 style="color:#f4c542;">POSTED NEAR YOU</h2>

      <p>
        Check out some of the featured events happening in your area.
      </p>

      <table width="100%">
        <tr>
          ${cards.join("")}
        </tr>
      </table>

      <div style="margin-top:40px; text-align:center;">
        <a href="${process.env.APP_URL}/events"
          style="background:#f4c542; color:#000; padding:14px 30px; text-decoration:none; border-radius:8px;">
          VIEW MORE EVENTS →
        </a>
      </div>

      <p style="margin-top:40px; font-size:12px; color:#888;">
        You are receiving this email because you are a registered user of Judah Global.
      </p>

    </div>
  </body>
  </html>
  `;
}