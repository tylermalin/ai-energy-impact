/**
 * server/_core/ingest.ts
 *
 * Express route for triggering the ingestion pipeline. Gated by an
 * ADMIN_KEY header so cron / curl invocations require the shared secret.
 *
 *   POST /api/ingest/run
 *     Headers:  X-Admin-Key: <ADMIN_KEY>
 *     Query:    ?adapter=<name>   optional — runs a single adapter
 *     Body:     none
 *
 * Returns the RunSummary as JSON.
 */

import type { Express, Request, Response } from "express";
import { runAll, runOne, ADAPTERS } from "../../lib/ingestion/run";

const ADMIN_KEY_HEADER = "x-admin-key";

function isAuthorized(req: Request): boolean {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    // Fail closed: if ADMIN_KEY isn't configured, the route refuses to run.
    return false;
  }
  const provided = req.header(ADMIN_KEY_HEADER);
  if (!provided) return false;
  // Constant-time compare to avoid timing oracles.
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}

export function registerIngestRoutes(app: Express): void {
  app.post("/api/ingest/run", async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized. Set ADMIN_KEY and pass X-Admin-Key header." });
      return;
    }
    const adapterParam = typeof req.query.adapter === "string" ? req.query.adapter : null;
    try {
      const summary = adapterParam ? await runOne(adapterParam) : await runAll();
      res.json({ ok: true, summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, error: msg });
    }
  });

  // Read-only meta endpoint — describes registered adapters for the admin UI.
  app.get("/api/ingest/adapters", (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    res.json({
      adapters: ADAPTERS.map((a) => ({
        name: a.name,
        coverage: a.coverage,
        description: a.description,
      })),
    });
  });
}
