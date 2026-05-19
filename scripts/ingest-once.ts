/**
 * scripts/ingest-once.ts
 *
 * Manual one-shot trigger for the ingestion pipeline. Used for dev /
 * local testing without going through the API or cron. Identical
 * behavior to POST /api/ingest/run minus the auth check.
 *
 * Usage:
 *   DATABASE_URL=mysql://... pnpm tsx scripts/ingest-once.ts            # runs all adapters
 *   DATABASE_URL=mysql://... pnpm tsx scripts/ingest-once.ts benchlm    # runs one adapter
 */

import { runAll, runOne } from "../lib/ingestion/run";

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

async function main() {
  const target = process.argv[2];
  const t0 = Date.now();
  const summary = target ? await runOne(target) : await runAll();
  // eslint-disable-next-line no-console
  console.log("\n=== Run summary ===");
  // eslint-disable-next-line no-console
  console.log(`Adapters:     ${summary.totalAdapters}`);
  // eslint-disable-next-line no-console
  console.log(`Succeeded:    ${summary.succeededAdapters}`);
  // eslint-disable-next-line no-console
  console.log(`Failed:       ${summary.failedAdapters}`);
  // eslint-disable-next-line no-console
  console.log(
    `Totals:       inserted=${summary.totals.inserted} pending=${summary.totals.pending} unchanged=${summary.totals.unchanged} errors=${summary.totals.errors}`,
  );
  // eslint-disable-next-line no-console
  console.log(`Wall-clock:   ${Date.now() - t0}ms`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[ingest-once] Unhandled error:", err);
  process.exit(1);
});
