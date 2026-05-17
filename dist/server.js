"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 4000;
// Debug: Log all environment variables
console.log("=== STARTUP DEBUG ===");
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("PGHOST:", process.env.PGHOST);
console.log("PGUSER:", process.env.PGUSER);
console.log("PGPASSWORD:", process.env.PGPASSWORD);
console.log("PGPORT:", process.env.PGPORT);
console.log("PGDATABASE:", process.env.PGDATABASE);
console.log("====================");
try {
    const server = app_1.default.listen(PORT, () => {
        console.log(`Judah Global API running on port ${PORT}`);
    });
    server.on("error", (err) => {
        console.error("Server error:", err);
        process.exit(1);
    });
}
catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
}
