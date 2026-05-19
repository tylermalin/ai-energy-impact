/**
 * Phase 3 — ingestion pipeline types.
 *
 * NormalizedRecord is the canonical shape every adapter must emit. It
 * mirrors the Drizzle `model_energy_records` schema, minus DB-managed
 * fields (id, ingestedAt, createdAt, updatedAt, promotedAt, sanityDocId)
 * and with `sourceFingerprint` REQUIRED — adapters compute it via
 * lib/ingestion/fingerprint.ts.
 */

import type { InsertModelEnergyRecord } from "../../drizzle/schema";

/**
 * What an adapter returns from one `fetchAndNormalize()` call.
 *
 * Excludes DB-managed columns:
 *   - id, ingestedAt, createdAt, updatedAt (timestamp defaults)
 *   - promotedAt, sanityDocId (set later when human approves promotion)
 */
export type NormalizedRecord = Omit<
  InsertModelEnergyRecord,
  "id" | "ingestedAt" | "createdAt" | "updatedAt" | "promotedAt" | "sanityDocId"
> & {
  // sourceFingerprint is required (already required by the DB schema, but
  // we make it explicit on the type for adapter authors).
  sourceFingerprint: string;
};

export type AdapterCategoryCoverage = Array<"text" | "image" | "video" | "code">;

export interface Adapter {
  /** Stable identifier, written to `ingestion_runs.adapter`. */
  readonly name: string;
  /** Which categories this adapter covers. Used for filtering and reporting. */
  readonly coverage: AdapterCategoryCoverage;
  /** Brief human-readable description (for admin UI). */
  readonly description: string;
  /** Fetch + normalize. Throws on transport errors — the orchestrator wraps. */
  fetchAndNormalize(): Promise<NormalizedRecord[]>;
}

/**
 * Per-adapter result emitted by the orchestrator.
 */
export interface AdapterRunResult {
  adapter: string;
  status: "succeeded" | "failed" | "partial";
  inserted: number;
  pending: number;
  unchanged: number;
  errors: string[];
  durationMs: number;
}

/**
 * Summary written to `ingestion_runs.summary` for each orchestrator run.
 */
export interface RunSummary {
  startedAt: string;
  finishedAt: string;
  totalAdapters: number;
  succeededAdapters: number;
  failedAdapters: number;
  totals: {
    inserted: number;
    pending: number;
    unchanged: number;
    errors: number;
  };
  perAdapter: AdapterRunResult[];
}
