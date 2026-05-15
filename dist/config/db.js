"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const pg_1 = require("pg");
exports.db = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.db.connect()
    .then((client) => {
    console.log("PostgreSQL connected successfully");
    client.release();
})
    .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
});
