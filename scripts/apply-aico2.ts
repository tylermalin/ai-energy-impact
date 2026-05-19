/**
 * scripts/apply-aico2.ts
 *
 * One-shot pass that applies the Mālama AICo2 Methodology downstream
 * conversions (carbon, water) to every row in model_energy_records that
 * has an energyWh value but is missing carbon or water.
 *
 * Does NOT touch energy values — those came from third-party measurements
 * (HF Energy Score, ML.Energy, Artificial Analysis) and we trust them.
 * The energy-estimation path runs via the aico2-estimator ingestion
 * adapter, which fills GAPS for rows with no measured energy.
 *
 * Run with:
 *   DATABASE_URL=mysql://... pnpm tsx scripts/apply-aico2.ts
 *
 * Idempotent: re-running updates the audit fields but doesn't double-
 * apply since we use direct UPDATE statements keyed on row id.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { modelEnergyRecords } from "../drizzle/schema";
import { getDb } from "../server/_core/db-client";
import {
  computeCarbonGCO2e,
  computeWaterMl,
} from "../lib/methodology/aico2";
import {
  INDUSTRY_AVERAGE_WUE_L_PER_KWH,
  METHODOLOGY_VERSION,
  US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
} from "../lib/methodology/constants";

if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error("DATABASE_URL or TURSO_DATABASE_URL is required.");
  process.exit(1);
}

const db = getDb();

async function main() {
  // Rows that have energy but are missing carbon, water, or methodology audit.
  const candidates = await db
    .select()
    .from(modelEnergyRecords)
    .where(
      and(
        isNotNull(modelEnergyRecords.energyWh),
        or(
          isNull(modelEnergyRecords.carbonGCO2e),
          isNull(modelEnergyRecords.waterMl),
          isNull(modelEnergyRecords.methodologyVersion),
        ),
      ),
    );

  // eslint-disable-next-line no-console
  console.log(`[apply-aico2] Found ${candidates.length} rows needing AICo2 downstream conversion.`);

  let updated = 0;
  let skipped = 0;

  for (const row of candidates) {
    if (row.energyWh == null) {
      skipped++;
      continue;
    }
    const carbon = computeCarbonGCO2e(row.energyWh, US_2024_GRID_INTENSITY_G_CO2E_PER_KWH);
    const water = computeWaterMl(row.energyWh, INDUSTRY_AVERAGE_WUE_L_PER_KWH);

    await db
      .update(modelEnergyRecords)
      .set({
        // Only fill in missing values — preserve any third-party
        // carbon/water already on the row.
        carbonGCO2e: row.carbonGCO2e ?? carbon,
        waterMl: row.waterMl ?? water,
        gridIntensityGCO2ePerKWh: US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
        wueLPerKWh: INDUSTRY_AVERAGE_WUE_L_PER_KWH,
        methodologyVersion: METHODOLOGY_VERSION,
      })
      .where(eq(modelEnergyRecords.id, row.id));
    updated++;
  }

  // eslint-disable-next-line no-console
  console.log(`[apply-aico2] Done. updated=${updated} skipped=${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[apply-aico2] Unhandled error:", err);
  process.exit(1);
});
