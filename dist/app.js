"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/db");
const db_1 = require("./config/db");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const dns_1 = require("dns");
const dnsLookup = (0, util_1.promisify)(dns_1.lookup);
const eventPayments_routes_1 = __importDefault(require("./modules/eventPayments/eventPayments.routes"));
const webhook_controller_1 = require("./modules/payments/webhook.controller");
const eventSubmission_routes_1 = __importDefault(require("./routes/eventSubmission.routes"));
const eventDiscovery_routes_1 = __importDefault(require("./routes/eventDiscovery.routes"));
const discovery_routes_1 = __importDefault(require("./routes/discovery.routes"));
const adminEvents_routes_1 = __importDefault(require("./routes/adminEvents.routes"));
const eventPublic_controller_1 = require("./controllers/eventPublic.controller");
const adminMediaReview_routes_1 = __importDefault(require("./routes/adminMediaReview.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const orgAccounts_routes_1 = __importDefault(require("./modules/admin/orgAccounts/orgAccounts.routes"));
const org_routes_1 = __importDefault(require("./modules/org/org.routes"));
const orgEventSubmission_routes_1 = __importDefault(require("./routes/orgEventSubmission.routes"));
const payments_routes_1 = __importDefault(require("./modules/payments/payments.routes"));
const campaign_routes_1 = __importDefault(require("./modules/featuredPlacements/campaign.routes"));
const placementHold_routes_1 = __importDefault(require("./modules/placements/placementHold.routes"));
const placementPublic_routes_1 = __importDefault(require("./modules/public/placements/placementPublic.routes"));
const eventEngagement_routes_1 = __importDefault(require("./routes/eventEngagement.routes"));
const account_routes_1 = __importDefault(require("./modules/account/account.routes"));
const userNotificationCron_1 = require("./jobs/userNotificationCron");
(0, userNotificationCron_1.startUserNotificationCron)();
const userNotification_routes_1 = __importDefault(require("./routes/userNotification.routes"));
const promotionSync_routes_1 = __importDefault(require("./routes/promotionSync.routes"));
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true
}));
app.options("*", (0, cors_1.default)({
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
            }
            catch (dnsErr) {
                console.error("DNS lookup failed:", dnsErr.message);
            }
        }
        console.log("DATABASE_URL:", dbUrl); // Add this line
        const result = await db_1.db.query("SELECT NOW() as now");
        res.json({
            success: true,
            databaseUrlExists: !!dbUrl,
            databaseHost: dbUrl?.split("@")[1]?.split("/")[0],
            dbTime: result.rows[0].now,
        });
    }
    catch (error) {
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
app.use((0, cors_1.default)({
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
app.post("/api/v1/event-payments/webhook", express_1.default.raw({ type: "application/json" }), (req, res, next) => {
    console.log("🔥 app.ts /api/v1/event-payments/webhook hit");
    next();
}, webhook_controller_1.stripeWebhook);
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Judah Global API running");
});
app.use("/api/v1/event-payments", eventPayments_routes_1.default);
app.use("/api/v1/event-submissions", eventSubmission_routes_1.default);
app.use("/api/v1/events", eventDiscovery_routes_1.default);
app.use("/api/v1/discovery", discovery_routes_1.default);
app.use("/api/v1/admin", adminEvents_routes_1.default);
app.get("/api/events/:slug", eventPublic_controller_1.getPublicEventBySlug);
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
app.use("/api/v1/admin/media-review", adminMediaReview_routes_1.default);
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/admin", admin_routes_1.default);
app.use("/api/v1/org/events", orgEventSubmission_routes_1.default);
app.use("/api/v1/account", account_routes_1.default);
app.use("/api/v1/payments", payments_routes_1.default);
app.use("/api/v1/org-accounts", orgAccounts_routes_1.default);
app.use("/api/v1/org", org_routes_1.default);
app.use("/api/v1/campaigns", campaign_routes_1.default);
app.use("/api/v1/placements", placementHold_routes_1.default);
app.use("/api/v1/public/placements", placementPublic_routes_1.default);
app.use("/api/v1/event-engagement", eventEngagement_routes_1.default);
app.use("/api/v1/user-notifications", userNotification_routes_1.default);
app.use("/api/v1/promotion-sync", promotionSync_routes_1.default);
// ── Global error handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes. Express identifies error-handling
// middleware by its four-argument signature (err, req, res, next).
// Any unhandled throw — including ones from middleware earlier in the chain —
// will land here so we can log the full stack and return a clean 500.
app.use((err, req, res, next) => {
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
exports.default = app;
