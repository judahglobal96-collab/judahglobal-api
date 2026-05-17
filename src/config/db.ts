import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

db.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

db.on("error", (err) => {
  console.error("PostgreSQL connection error:", err.message);
});
