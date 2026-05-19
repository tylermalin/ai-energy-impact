/**
 * lib/ingestion/storage.ts
 *
 * DB-side glue for the ingestion pipeline:
 *
 *   - applyAdapterResults: take a list of NormalizedRecord, classify each
 *     as new / changed / unchanged against current DB state (by
 *     sourceFingerprint), then:
 *       new       → INSERT directly with lastVerifiedAt = now()
 *       changed   → write a row to pending_updates (do NOT overwrite live)
 *       unchanged → UPDATE lastVerifiedAt = now() on the existing row
 *
 *   - logIngestionRun: open / close a row in ingestion_runs with the
 *     summary JSON.
 */

import { eq, inArray, sql } from "drizzle-orm";
import {
  modelEnergyRecords,
  pendingUpdates,
  ingestionRuns,
  type InsertModelEnergyRecord,
  type InsertPendingUpdate,
  type ModelEnergyRecord,
} from "../../drizzle/schema";
import { getDb } from "../../server/_core/db-client";
import type { AdapterRunResult, NormalizedRecord, RunSummary } from "./types";

/** Fields the orchestrator compares to decide "changed" vs "unchanged". */
const COMPARED_FIELDS = [
  "energyWh",
  "energyWhMin",
  "energyWhMax",
  "carbonGCO2e",
  "waterMl",
  "classification",
  "confidence",
  "sourceUrl",
  "sourceCitation",
  "hardware",
  "softwareVersion",
  "contextLength",
  "batchSize",
  "promptClass",
  "trainingOrInference",
  "compositeRank",
  "inTop20",
  "scaffold",
  "sweVerified",
  "swePro",
  "status",
  "statusNote",
  "vendor",
  "modelFamily",
  "modelVersion",
  "parameters",
  "openWeight",
  "utilityScore",
] as const;
type ComparedField = (typeof COMPARED_FIELDS)[number];

interface FieldDiff {
  field: ComparedField;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  to: any;
}

function diff(existing: ModelEnergyRecord, proposed: NormalizedRecord): FieldDiff[] {
  const out: FieldDiff[] = [];
  for (const f of COMPARED_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const before = (existing as any)[f];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after = (proposed as any)[f];
    if (!isEqual(before, after)) {
      out.push({ field: f, from: before, to: after });
    }
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  // Loose numeric equality for floats (round-trip from MySQL DOUBLE loses tiny precision)
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 1e-9;
  }
  return false;
}

export interface ApplyResult {
  inserted: number;
  pending: number;
  unchanged: number;
  errors: string[];
}

/**
 * Apply one adapter's batch. Reads existing rows by fingerprint in bulk,
 * then per-record decides: insert / queue / bump.
 */
export async function applyAdapterResults(
  adapterName: string,
  records: NormalizedRecord[],
): Promise<ApplyResult> {
  const db = getDb();
  const result: ApplyResult = { inserted: 0, pending: 0, unchanged: 0, errors: [] };

  if (records.length === 0) return result;

  // Bulk-fetch existing rows for the fingerprints we care about.
  const fps = Array.from(new Set(records.map((r) => r.sourceFingerprint)));
  const existing = await db
    .select()
    .from(modelEnergyRecords)
    .where(inArray(modelEnergyRecords.sourceFingerprint, fps));

  const byFp = new Map<string, ModelEnergyRecord>();
  for (const row of existing) {
    byFp.set(row.sourceFingerprint, row);
  }

  for (const rec of records) {
    try {
      const current = byFp.get(rec.sourceFingerprint);
      if (!current) {
        // NEW — insert directly.
        const insert: InsertModelEnergyRecord = {
          ...rec,
          lastVerifiedAt: new Date(),
        };
        await db.insert(modelEnergyRecords).values(insert);
        result.inserted++;
        continue;
      }

      const fieldDiffs = diff(current, rec);
      if (fieldDiffs.length === 0) {
        // UNCHANGED — bump lastVerifiedAt only.
        await db
          .update(modelEnergyRecords)
          .set({ lastVerifiedAt: new Date() })
          .where(eq(modelEnergyRecords.id, current.id));
        result.unchanged++;
        continue;
      }

      // CHANGED — queue for human review. Do NOT overwrite live row.
      const summary = fieldDiffs
        .map((d) => `${d.field}: ${JSON.stringify(d.from)} → ${JSON.stringify(d.to)}`)
        .join(" | ");
      const pending: InsertPendingUpdate = {
        sourceFingerprint: rec.sourceFingerprint,
        targetRecordId: current.id,
        adapter: adapterName,
        proposed: rec,
        current: current,
        diffSummary: summary,
        status: "pending",
      };
      await db.insert(pendingUpdates).values(pending);
      result.pending++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${rec.modelName} (${rec.category}): ${msg}`);
    }
  }

  return result;
}

/* ------------------------------------------------------------------ */
/* ingestion_runs logging                                              */
/* ------------------------------------------------------------------ */

/**
 * Start an ingestion_runs row. Returns the row id so the orchestrator
 * can update it on completion.
 */
export async function openIngestionRun(adapter: string): Promise<number> {
  const db = getDb();
  // libSQL/SQLite: use RETURNING to get the inserted id back portably.
  const rows = await db
    .insert(ingestionRuns)
    .values({ adapter, status: "running" })
    .returning({ id: ingestionRuns.id });
  const id = rows[0]?.id;
  if (typeof id !== "number") {
    throw new Error("openIngestionRun: could not determine insert id");
  }
  return id;
}

export async function closeIngestionRun(
  id: number,
  result: AdapterRunResult,
  consecutiveFailures: number,
): Promise<void> {
  const db = getDb();
  await db
    .update(ingestionRuns)
    .set({
      finishedAt: new Date(),
      status: result.status,
      summary: {
        inserted: result.inserted,
        pending: result.pending,
        unchanged: result.unchanged,
        errors: result.errors,
        durationMs: result.durationMs,
      },
      errors: result.errors.length > 0 ? result.errors.join("\n") : null,
      consecutiveFailures,
    })
    .where(eq(ingestionRuns.id, id));
}

/**
 * Count the consecutive failed runs for an adapter, looking backwards.
 * Used to surface the 3-strike "needs attention" flag on the admin dashboard.
 */
export async function countConsecutiveFailures(adapter: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ status: ingestionRuns.status })
    .from(ingestionRuns)
    .where(eq(ingestionRuns.adapter, adapter))
    .orderBy(sql`${ingestionRuns.startedAt} DESC`)
    .limit(10);
  let streak = 0;
  for (const r of rows) {
    if (r.status === "failed") streak++;
    else break;
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Aggregate summary helper                                            */
/* ------------------------------------------------------------------ */

export function summarize(perAdapter: AdapterRunResult[], startedAt: Date): RunSummary {
  const totals = {
    inserted: 0,
    pending: 0,
    unchanged: 0,
    errors: 0,
  };
  let succeeded = 0;
  let failed = 0;
  for (const r of perAdapter) {
    totals.inserted += r.inserted;
    totals.pending += r.pending;
    totals.unchanged += r.unchanged;
    totals.errors += r.errors.length;
    if (r.status === "succeeded" || r.status === "partial") succeeded++;
    else failed++;
  }
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    totalAdapters: perAdapter.length,
    succeededAdapters: succeeded,
    failedAdapters: failed,
    totals,
    perAdapter,
  };
}
