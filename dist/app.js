"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
require("./config/db");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
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
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(",") || [
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
exports.default = app;
