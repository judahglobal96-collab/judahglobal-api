import { Pool } from "pg";

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout and retry logic

  ssl: {
    rejectUnauthorized: false,
  },
  
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 20,
});

db.on("connect", () => {
  console.log("PostgreSQL connected successfully");
});

db.on("error", (err) => {
  console.error("PostgreSQL connection error:", err.message);
});

// Test connection on startup
db.query("SELECT NOW()")
  .then(() => {
    console.log("✓ Database connection test successful");
  })
  .catch((err) => {
    console.error("✗ Database connection test failed:", err.message);
    console.error("Connection string:", process.env.DATABASE_URL);
  });

