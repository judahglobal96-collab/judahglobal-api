"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
exports.db = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    // Add connection timeout and retry logic
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 20,
});
exports.db.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});
exports.db.on("error", (err) => {
    console.error("PostgreSQL connection error:", err.message);
});
// Test connection on startup
exports.db.query("SELECT NOW()")
    .then(() => {
    console.log("✓ Database connection test successful");
})
    .catch((err) => {
    console.error("✗ Database connection test failed:", err.message);
    console.error("Connection string:", process.env.DATABASE_URL);
});
