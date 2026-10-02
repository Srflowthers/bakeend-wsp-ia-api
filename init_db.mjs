import { createClient } from "@libsql/client";
import fs from "fs";

async function main() {
  const db = createClient({
    url: "file:local.db",
  });

  const schema = fs.readFileSync("schema.sql", "utf-8");
  const statements = schema.split(';').filter(stmt => stmt.trim() !== '');

  for (const stmt of statements) {
    await db.execute(stmt);
  }

  console.log("Base de datos SQLite local generada (local.db) con usuario admin y tablas.");
}

main().catch(console.error);
