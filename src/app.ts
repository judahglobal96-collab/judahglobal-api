import "./config/db";
import { db } from "./config/db";
import express from "express";
import cors from "cors";
import path from "path";
import { promisify } from "util";
import { lookup } from "dns";

const dnsLookup = promisify(lookup);

import eventPaymentsRoutes from "./modules/eventPayments/eventPayments.routes";
import { stripeWebhook } from "./modules/payments/webhook.controller";
import eventSubmissionRoutes from "./routes/eventSubmission.routes";
import eventDiscoveryRoutes from "./routes/eventDiscovery.routes";
import discoveryRoutes from "./routes/discovery.routes";
import adminEventsRoutes from "./routes/adminEvents.routes";
import { getPublicEventBySlug } from "./controllers/eventPublic.controller";
import adminMediaReviewRoutes from "./routes/adminMediaReview.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import orgAccountsRoutes from "./modules/admin/orgAccounts/orgAccounts.routes";
import orgRoutes from "./modules/org/org.routes";
import orgEventSubmissionRoutes from "./routes/orgEventSubmission.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import campaignRoutes from "./modules/featuredPlacements/campaign.routes";
import placementHoldRoutes from "./modules/placements/placementHold.routes";
import placementPublicRoutes from "./modules/public/placements/placementPublic.routes";
import eventEngagementRoutes from "./routes/eventEngagement.routes";
import accountRoutes from "./modules/account/account.routes";
import { startUserNotificationCron } from "./jobs/userNotificationCron";
      startUserNotificationCron();
import userNotificationRoutes from "./routes/userNotification.routes";
import promotionSyncRoutes from "./routes/promotionSync.routes";
//*import campaignMediaRoutes from "./modules/monetization/campaignMedia.routes";*//
import eventMediaRoutes from "./routes/eventMedia.routes";
import eventMediaModerationRoutes from "./routes/eventMediaModeration.routes";

const app = express();

// ── Global request logger ────────────────────────────────────────────────────
// Runs before every other middleware so we can see every inbound request,
// confirm it reaches the auth routes, and surface any synchronous throw that
// would otherwise produce a silent 500.
app.use((req, _res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.path}`, {
    body: req.body,
    contentType: req.headers['content-type'],
  });

  if (req.path.startsWith('/api/v1/auth')) {
    console.log(`[AUTH ROUTE HIT] ${req.method} ${req.path}`);
  }

  next();
});
// ────────────────────────────────────────────────────────────────────────────

const allowedOrigins = [
  "https://www.judahglobal.org",
  "https://judahglobal.org",
  "https://judah-global-frontend-production.up.railway.app",
  "http://localhost:3000",
  "http://localhost:5173"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.options("*", cors({
  origin: allowedOrigins,
  credentials: true
}));

app.get("/env-check", (_req, res) => {
  res.json({
    databaseUrlExists: !!process.env.DATABASE_URL,
    databaseUrlHost: process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).host
      : null,
  });
});

app.get("/db-health", async (_req, res) => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    console.log("=== /db-health ENDPOINT ===");
    console.log("DATABASE_URL exists:", !!dbUrl);
    console.log("DATABASE_URL:", dbUrl);
    
    if (dbUrl) {
      const url = new URL(dbUrl);
      const hostname = url.hostname;
      console.log("Hostname from URL:", hostname);
      
      try {
        const result = await dnsLookup(hostname);
        console.log("DNS lookup result:", result);
      } catch (dnsErr: any) {
        console.error("DNS lookup failed:", dnsErr.message);
      }
    }

    console.log("DATABASE_URL:", dbUrl); // Add this line

    const result = await db.query("SELECT NOW() as now");

    res.json({
      success: true,
      databaseUrlExists: !!dbUrl,
      databaseHost: dbUrl?.split("@")[1]?.split("/")[0],
      dbTime: result.rows[0].now,
    });
  } catch (error: any) {
    const dbUrl = process.env.DATABASE_URL;
    console.error("=== /db-health ERROR ===");
    console.error("DATABASE_URL exists:", !!dbUrl);
    console.error("DATABASE_URL:", dbUrl);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error address:", error?.address);
    console.error("Error port:", error?.port);

    res.status(500).json({
      success: false,
      databaseUrlExists: !!dbUrl,
      databaseHost: dbUrl?.split("@")[1]?.split("/")[0],
      code: error?.code,
      message: error?.message,
      address: error?.address,
      port: error?.port,
    });
  }
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://judah-global-frontend-production.up.railway.app"
  ],
  credentials: true,
}));

/**
 * Stripe webhook FIRST (raw body required)
 * Must be before express.json()
 */
app.post(
  "/api/v1/event-payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    console.log("🔥 app.ts /api/v1/event-payments/webhook hit");
    next();
  },
  stripeWebhook
);

app.use(express.json());

import fs from "fs";

app.get("/debug/uploads", (_req, res) => {
  const uploadsPath = path.join(process.cwd(), "uploads");

  const tree = fs.existsSync(uploadsPath)
    ? fs.readdirSync(uploadsPath).map((name) => {
        const fullPath = path.join(uploadsPath, name);
        return {
          name,
          isDirectory: fs.statSync(fullPath).isDirectory(),
          files: fs.statSync(fullPath).isDirectory()
            ? fs.readdirSync(fullPath)
            : [],
        };
      })
    : [];

  res.json({
    cwd: process.cwd(),
    uploadsPath,
    exists: fs.existsSync(uploadsPath),
    tree,
  });
});

app.get("/", (_req, res) => {
  res.send("Judah Global API running");
});

app.use("/api/v1/event-payments", eventPaymentsRoutes);
app.use("/api/v1/event-submissions", eventSubmissionRoutes);
app.use("/api/v1/events", eventDiscoveryRoutes);
app.use("/api/v1/discovery", discoveryRoutes);

app.get("/api/events/:slug", getPublicEventBySlug);

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/v1/admin/media-review", adminMediaReviewRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/admin", adminEventsRoutes);

app.use("/api/v1/org/events", orgEventSubmissionRoutes);
app.use("/api/v1/org-accounts", orgAccountsRoutes);
app.use("/api/v1/org", orgRoutes);

app.use("/api/v1/account", accountRoutes);

app.use("/api/v1/payments", paymentsRoutes);
app.use("/api/v1/campaigns", campaignRoutes);

//*app.use("/api/campaign-media", campaignMediaRoutes);*//

app.use("/api/v1/events", eventMediaRoutes);
app.use("/api/admin/events/media", eventMediaModerationRoutes);

app.use("/api/v1/placements", placementHoldRoutes);
app.use("/api/v1/public/placements", placementPublicRoutes);
app.use("/api/v1/event-engagement", eventEngagementRoutes);
app.use("/api/v1/user-notifications", userNotificationRoutes);
app.use("/api/v1/promotion-sync", promotionSyncRoutes);

// ── Global error handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes. Express identifies error-handling
// middleware by its four-argument signature (err, req, res, next).
// Any unhandled throw — including ones from middleware earlier in the chain —
// will land here so we can log the full stack and return a clean 500.
app.use((err: any, req: any, res: any, next: any) => {
  console.error('[GLOBAL ERROR HANDLER]', {
    method: req.method,
    path: req.path,
    message: err?.message,
    name: err?.name,
    stack: err?.stack,
    body: req.body,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    message: 'Internal server error.',
    error: err?.message,
  });
});
// ────────────────────────────────────────────────────────────────────────────

export default app;
