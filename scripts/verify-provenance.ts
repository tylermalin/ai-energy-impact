/**
 * scripts/verify-provenance.ts
 *
 * Phase 1 acceptance gate: prints any model_energy_records row that is
 * missing a required provenance field. Exits 0 if every row passes,
 * non-zero if any fail.
 *
 * Run with:
 *   DATABASE_URL=mysql://... pnpm tsx scripts/verify-provenance.ts
 */

import { drizzle } from "drizzle-orm/mysql2";
import { modelEnergyRecords } from "../drizzle/schema";

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error("DATABASE_URL is required to run the verify-provenance script.");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

const REQUIRED_FIELDS = [
  "modelName",
  "modelFamily",
  "vendor",
  "category",
  "taskClass",
  "energyUnit",
  "classification",
  "confidence",
  "sourceName",
  "sourceUrl",
  "measurementDate",
  "trainingOrInference",
] as const;

type RequiredField = (typeof REQUIRED_FIELDS)[number];

async function main() {
  const rows = await db.select().from(modelEnergyRecords);
  // eslint-disable-next-line no-console
  console.log(`[verify] Inspecting ${rows.length} rows for required provenance fields...`);

  const failures: { id: number; modelName: string; missing: RequiredField[] }[] = [];

  for (const row of rows) {
    const missing: RequiredField[] = [];
    for (const f of REQUIRED_FIELDS) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const v = (row as any)[f];
      if (v === null || v === undefined || v === "") {
        missing.push(f);
      }
    }
    if (missing.length > 0) {
      failures.push({ id: row.id, modelName: row.modelName ?? "(unnamed)", missing });
    }
  }

  if (failures.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`[verify] PASS — all ${rows.length} rows have complete provenance.`);
    process.exit(0);
  }

  // eslint-disable-next-line no-console
  console.error(`[verify] FAIL — ${failures.length} rows missing required fields:`);
  for (const f of failures) {
    // eslint-disable-next-line no-console
    console.error(`  • #${f.id} "${f.modelName}" — missing: ${f.missing.join(", ")}`);
  }
  process.exit(1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[verify] Unhandled error:", err);
  process.exit(1);
});
