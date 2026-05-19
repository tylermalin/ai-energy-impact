/**
 * lib/ingestion/run.ts
 *
 * Orchestrator. Runs every adapter in `ADAPTERS`, applies its results to
 * the DB, and logs each run to `ingestion_runs`. One failed adapter does
 * NOT crash the run — its row is marked status="failed" and the next
 * adapter proceeds.
 *
 * Exports:
 *   - runAll()       — runs every adapter
 *   - runOne(name)   — runs a single adapter by name
 *   - ADAPTERS       — the registered adapter list
 */

import {
  applyAdapterResults,
  closeIngestionRun,
  countConsecutiveFailures,
  openIngestionRun,
  summarize,
} from "./storage";
import type { Adapter, AdapterRunResult, RunSummary } from "./types";

import { benchlmAdapter } from "./adapters/benchlm";
import { huggingfaceEnergyScoreAdapter } from "./adapters/huggingface-energy-score";
import { mlEnergyAdapter } from "./adapters/ml-energy";
import { artificialAnalysisAdapter } from "./adapters/artificial-analysis";
import { lmarenaAdapter } from "./adapters/lmarena";
import { sweBenchAdapter } from "./adapters/swe-bench";
import { systemCardsAdapter } from "./adapters/system-cards";
import { aico2EstimatorAdapter } from "./adapters/aico2-estimator";

// ORDER MATTERS — aico2-estimator runs LAST so it sees gaps left by all
// other adapters and only fills models that nobody else measured.
export const ADAPTERS: Adapter[] = [
  benchlmAdapter,
  huggingfaceEnergyScoreAdapter,
  mlEnergyAdapter,
  artificialAnalysisAdapter,
  lmarenaAdapter,
  sweBenchAdapter,
  systemCardsAdapter,
  aico2EstimatorAdapter,
];

const ADAPTERS_BY_NAME = new Map<string, Adapter>(ADAPTERS.map((a) => [a.name, a]));

async function runSingleAdapter(adapter: Adapter): Promise<AdapterRunResult> {
  const t0 = Date.now();
  const runId = await openIngestionRun(adapter.name);

  let result: AdapterRunResult;
  try {
    const records = await adapter.fetchAndNormalize();
    const applied = await applyAdapterResults(adapter.name, records);
    result = {
      adapter: adapter.name,
      status: applied.errors.length === 0 ? "succeeded" : "partial",
      inserted: applied.inserted,
      pending: applied.pending,
      unchanged: applied.unchanged,
      errors: applied.errors,
      durationMs: Date.now() - t0,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result = {
      adapter: adapter.name,
      status: "failed",
      inserted: 0,
      pending: 0,
      unchanged: 0,
      errors: [msg],
      durationMs: Date.now() - t0,
    };
  }

  const streak = result.status === "failed" ? await countConsecutiveFailures(adapter.name) + 1 : 0;
  await closeIngestionRun(runId, result, streak);

  // eslint-disable-next-line no-console
  console.log(
    `[ingest] ${adapter.name}: status=${result.status} inserted=${result.inserted} pending=${result.pending} unchanged=${result.unchanged} errors=${result.errors.length} ${result.durationMs}ms`,
  );
  if (streak >= 3) {
    // eslint-disable-next-line no-console
    console.warn(`[ingest] ⚠ ${adapter.name} has failed ${streak} consecutive runs — admin attention required.`);
  }
  return result;
}

export async function runAll(): Promise<RunSummary> {
  const startedAt = new Date();
  const perAdapter: AdapterRunResult[] = [];
  for (const adapter of ADAPTERS) {
    perAdapter.push(await runSingleAdapter(adapter));
  }
  return summarize(perAdapter, startedAt);
}

export async function runOne(name: string): Promise<RunSummary> {
  const adapter = ADAPTERS_BY_NAME.get(name);
  if (!adapter) {
    throw new Error(`Unknown adapter: ${name}. Known: ${Array.from(ADAPTERS_BY_NAME.keys()).join(", ")}`);
  }
  const startedAt = new Date();
  const result = await runSingleAdapter(adapter);
  return summarize([result], startedAt);
}
