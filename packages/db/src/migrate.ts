/**
 * Database migration runner for Neon Postgres (or any PostgreSQL).
 *
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require" \
 *     bun run packages/db/src/migrate.ts
 *
 * This script runs all SQL migration files in order, then exits.
 * It uses the postgres.js driver which handles Neon's SSL requirement
 * automatically when `sslmode=require` is present in the connection string.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const connectionString = process.env["DATABASE_URL"];

  if (!connectionString) {
    console.error("ERROR: DATABASE_URL environment variable is required.");
    console.error(
      "Example: postgresql://user:pass@ep-xxx.region.neon.tech/dbname?sslmode=require",
    );
    process.exit(1);
  }

  console.log("Connecting to database...");

  // Neon requires SSL — the postgres.js driver respects `sslmode=require` from
  // the connection string automatically. We also pass `ssl: "require"` as a
  // fallback in case the URL doesn't contain sslmode.
  const isNeon = connectionString.includes(".neon.tech");
  const sslConfig = isNeon || connectionString.includes("sslmode=require");

  const client = postgres(connectionString, {
    max: 1,
    // Disable prepared statements for Neon's serverless driver compatibility.
    // Neon's connection pooler (pgbouncer in transaction mode) does not support
    // prepared statements.
    prepare: false,
    ...(sslConfig ? { ssl: "require" as const } : {}),
  });

  const db = drizzle(client);
  const migrationsFolder = path.resolve(__dirname, "migrations");

  console.log(`Running migrations from: ${migrationsFolder}`);

  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
