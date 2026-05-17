"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
exports.db = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.db.on("connect", () => {
    console.log("PostgreSQL connected successfully");
});
exports.db.on("error", (err) => {
    console.error("PostgreSQL connection error:", err.message);
});
