import app from "./app";

const PORT = process.env.PORT || 4000;

// Debug: Log all environment variables
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
console.log("PGHOST:", process.env.PGHOST ? "SET" : "NOT SET");
console.log("PGUSER:", process.env.PGUSER ? "SET" : "NOT SET");
console.log("PGPASSWORD:", process.env.PGPASSWORD ? "SET" : "NOT SET");
console.log("PGPORT:", process.env.PGPORT ? "SET" : "NOT SET");
console.log("PGDATABASE:", process.env.PGDATABASE ? "SET" : "NOT SET");
console.log("All env keys:", Object.keys(process.env).filter(k => k.includes("PG") || k.includes("DATABASE")).join(", "));
console.log("=============================");

app.listen(PORT, () => {
  console.log(`Judah Global API running on port ${PORT}`);
});
