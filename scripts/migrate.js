const { Client } = require("pg");
const fs = require("fs");

async function run() {
  const sql = fs.readFileSync("supabase/migration.sql", "utf8");

  // Session pooler — IPv4 reachable
  const client = new Client({
    host: "aws-0-ap-southeast-1.pooler.supabase.com",
    port: 6543,
    user: "postgres.cvvpjqmebsneoogvjgsw",
    password: "Z+W+EWM$/9yKMzr",
    database: "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log("Connected! Running migration...");
  await client.query(sql);
  console.log("Migration completed successfully!");

  // Verify tables exist
  const tables = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("Tables:", tables.rows.map((r) => r.table_name).join(", "));

  await client.end();
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
