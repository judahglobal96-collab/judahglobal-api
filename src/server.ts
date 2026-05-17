import app from "./app";

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

app.listen(PORT, () => {
  console.log(`Judah Global API running on port ${PORT}`);
});
