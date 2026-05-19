import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
const c = createClient({ url, authToken });

const all = await c.execute(
  "SELECT name, type FROM sqlite_master WHERE type IN ('table','view') ORDER BY type, name"
);
console.log("All tables/views:");
for (const r of all.rows) console.log(`  [${r.type}] ${r.name}`);
