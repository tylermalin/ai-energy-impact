/**
 * lib/dashboard/models.ts
 *
 * Server-side dashboard read path. Returns one canonical row per
 * (modelName, category) from the model_energy_records table.
 *
 * Why dedup: ingestion adapters write one row per (model, category,
 * source, measurementDate). After running benchlm + huggingface +
 * artificial-analysis + lmarena + system-cards, the same model in the
 * same category can have 3-5 rows — each a legitimate measurement from
 * a different source. The public dashboard surfaces ONE row per
 * (model, category); the others are accessible via row-expand "alternative
 * measurements" (deferred follow-up) or by querying the DB directly.
 *
 * Priority rule (highest wins):
 *   1. classification: measured > derived > estimated
 *   2. confidence: high > medium > medium-low > low
 *   3. lastVerifiedAt: most recent wins
 *   4. compositeRank: non-null wins (so the BenchLM rank row is preferred
 *      over a measurement row when both exist)
 *
 * Rule 4 is intentional: when a model has both a "BenchLM rank" row
 * (no energy) and a "Hugging Face energy" row (energy but no rank),
 * the dashboard wants ONE row that carries both pieces of information.
 * We merge the energy fields onto the rank row when both exist for the
 * same (modelName, category).
 */

import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { modelEnergyRecords, type ModelEnergyRecord } from "../../drizzle/schema";

let _db: MySql2Database | null = null;
function getDb(): MySql2Database {
  if (!_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    _db = drizzle(process.env.DATABASE_URL);
  }
  return _db;
}

const CLASSIFICATION_RANK: Record<string, number> = {
  measured: 3,
  derived: 2,
  estimated: 1,
};
const CONFIDENCE_RANK: Record<string, number> = {
  high: 4,
  medium: 3,
  "medium-low": 2,
  low: 1,
};

function score(row: ModelEnergyRecord): number {
  // Composite score for ranking. Higher = better.
  const classScore = (CLASSIFICATION_RANK[row.classification] ?? 0) * 1_000_000;
  const confScore = (CONFIDENCE_RANK[row.confidence] ?? 0) * 100_000;
  const verified = row.lastVerifiedAt instanceof Date ? row.lastVerifiedAt.getTime() : 0;
  // Normalize verified-at into the low bits so it tie-breaks within score class.
  const verifiedScore = Math.floor(verified / 1000) % 100_000;
  return classScore + confScore + verifiedScore;
}

/**
 * For a group of rows sharing (modelName, category), pick the "primary"
 * and merge in fields from the others when the primary doesn't have them.
 *
 * Specifically: energyWh / carbonGCO2e / waterMl / hardware / contextLength /
 * batchSize / standardizedConditions are merged in from the highest-scoring
 * row that has them, if the primary row doesn't. Similarly compositeRank +
 * inTop20 are merged in from any row that has them (BenchLM ranking rows).
 */
function pickAndMerge(group: ModelEnergyRecord[]): ModelEnergyRecord {
  // Sort highest-score first.
  const sorted = [...group].sort((a, b) => score(b) - score(a));
  const primary = sorted[0];

  // Best-of: for fields that may be null on the primary but present on
  // another row, take the highest-scoring non-null value.
  function bestOf<K extends keyof ModelEnergyRecord>(field: K): ModelEnergyRecord[K] | null {
    for (const r of sorted) {
      const v = r[field];
      if (v !== null && v !== undefined) return v;
    }
    return null;
  }

  return {
    ...primary,
    // Always prefer ranking-bearing row if any exists.
    compositeRank: bestOf("compositeRank") ?? primary.compositeRank,
    inTop20: group.some((r) => r.inTop20) || primary.inTop20,
    // Energy / measurement data: take the best non-null.
    energyWh: bestOf("energyWh") ?? primary.energyWh,
    energyWhMin: bestOf("energyWhMin") ?? primary.energyWhMin,
    energyWhMax: bestOf("energyWhMax") ?? primary.energyWhMax,
    carbonGCO2e: bestOf("carbonGCO2e") ?? primary.carbonGCO2e,
    waterMl: bestOf("waterMl") ?? primary.waterMl,
    hardware: bestOf("hardware") ?? primary.hardware,
    softwareVersion: bestOf("softwareVersion") ?? primary.softwareVersion,
    contextLength: bestOf("contextLength") ?? primary.contextLength,
    batchSize: bestOf("batchSize") ?? primary.batchSize,
    standardizedConditions: bestOf("standardizedConditions") ?? primary.standardizedConditions,
    // Code-specific
    scaffold: bestOf("scaffold") ?? primary.scaffold,
    sweVerified: bestOf("sweVerified") ?? primary.sweVerified,
    swePro: bestOf("swePro") ?? primary.swePro,
    // Identity additions
    vendor: primary.vendor || bestOf("vendor") || "Unknown",
    openWeight: group.some((r) => r.openWeight) || primary.openWeight,
    parameters: bestOf("parameters") ?? primary.parameters,
    utilityScore: bestOf("utilityScore") ?? primary.utilityScore,
    // AICo2 audit fields — take from the highest-scoring row that has them.
    tauApplied: bestOf("tauApplied") ?? primary.tauApplied,
    fApplied: bestOf("fApplied") ?? primary.fApplied,
    pueApplied: bestOf("pueApplied") ?? primary.pueApplied,
    gridIntensityGCO2ePerKWh:
      bestOf("gridIntensityGCO2ePerKWh") ?? primary.gridIntensityGCO2ePerKWh,
    wueLPerKWh: bestOf("wueLPerKWh") ?? primary.wueLPerKWh,
    facilityClass: bestOf("facilityClass") ?? primary.facilityClass,
    hardwareClass: bestOf("hardwareClass") ?? primary.hardwareClass,
    methodologyVersion: bestOf("methodologyVersion") ?? primary.methodologyVersion,
  };
}

export interface DashboardModelsResult {
  rows: ModelEnergyRecord[];
  totalRowCount: number;        // pre-dedup
  dedupedRowCount: number;      // post-dedup
}

/**
 * Read the dashboard rows from MySQL. Returns deduped+merged rows ready
 * for the public DataExplorer.
 *
 * Filter: only rows where `active = true` (mirrors the existing Sanity
 * GROQ query semantics — wait, model_energy_records doesn't have an
 * `active` column, only Sanity does). For MySQL we filter on
 * `status != 'deprecated'` instead.
 */
export async function getDashboardModels(): Promise<DashboardModelsResult> {
  const db = getDb();
  // We pull everything and dedup in JS. ~200 rows max; trivial.
  const allRows = await db.select().from(modelEnergyRecords);
  const live = allRows.filter((r) => r.status !== "deprecated");

  const groups = new Map<string, ModelEnergyRecord[]>();
  for (const r of live) {
    const key = `${r.modelName}::${r.category}`;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }

  const deduped: ModelEnergyRecord[] = [];
  // Array.from() avoids the downlevelIteration requirement on Map iterators.
  for (const group of Array.from(groups.values())) {
    deduped.push(pickAndMerge(group));
  }

  // Sort: inTop20 first, then compositeRank asc (nulls last), then modelName.
  deduped.sort((a, b) => {
    if (a.inTop20 !== b.inTop20) return a.inTop20 ? -1 : 1;
    const ar = a.compositeRank ?? Number.MAX_SAFE_INTEGER;
    const br = b.compositeRank ?? Number.MAX_SAFE_INTEGER;
    if (ar !== br) return ar - br;
    return a.modelName.localeCompare(b.modelName);
  });

  return {
    rows: deduped,
    totalRowCount: allRows.length,
    dedupedRowCount: deduped.length,
  };
}

// reference (kept to avoid unused-import elimination of eq if we later filter)
void eq;
