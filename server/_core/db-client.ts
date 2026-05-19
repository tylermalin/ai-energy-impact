/**
 * server/_core/db-client.ts
 *
 * Shared libSQL (Turso) connection factory. Replaces the inline
 * `drizzle(process.env.DATABASE_URL)` pattern that used to live in
 * every script + tRPC handler.
 *
 * Local dev: DATABASE_URL = file:./local.db   (no auth token needed)
 * Production:  DATABASE_URL = libsql://your-db.turso.io
 *              DATABASE_AUTH_TOKEN = <provisioned token>
 *
 * The Vercel Turso integration injects both env vars automatically.
 */

import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

let _client: Client | null = null;
let _db: LibSQLDatabase | null = null;

export function getDbClient(): Client {
  if (_client) return _client;
  const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Local: `file:./local.db`. Prod: provisioned by Vercel/Turso integration as TURSO_DATABASE_URL.",
    );
  }
  _client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  });
  return _client;
}

export function getDb(): LibSQLDatabase {
  if (_db) return _db;
  _db = drizzle(getDbClient());
  return _db;
}

/** For tests / scripts that need to reset the cached client. */
export function _resetDbForTests(): void {
  _client = null;
  _db = null;
}
