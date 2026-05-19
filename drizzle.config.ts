import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local first (Vercel-injected Turso creds), then .env (legacy fallback).
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

// Use || (not ??) so empty strings (Vercel sets unset vars as "") fall through.
const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL or TURSO_DATABASE_URL is required to run drizzle commands");
}

// Turso uses authToken alongside the URL. For local file: URLs the token
// is unnecessary and ignored.
const authToken = process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
