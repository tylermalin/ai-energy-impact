/**
 * adapters/swe-bench.ts
 *
 * SWE-bench Verified leaderboard. Code-category capability cross-check.
 * Emits sweVerified + swePro scores; no energy data.
 *
 * Source: https://www.swebench.com/
 *
 * classification = "measured" (the benchmark score itself is measured)
 * confidence = "high" for the score; energy attribution is separate
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface SWEBenchRow {
  modelName: string;
  vendor: string;
  scaffold: string;
  sweVerified: number;
  swePro?: number | null;
  openWeight?: boolean;
}

const SOURCE_NAME = "SWE-bench Verified";
const SOURCE_URL = "https://www.swebench.com/";

async function fetchLive(): Promise<SWEBenchRow[]> {
  // SWE-bench publishes a JSON leaderboard. Real adapter would fetch
  // https://www.swebench.com/lite/leaderboard.json (or equivalent).
  throw new Error("swe-bench: live HTTP not yet implemented");
}
function fetchMock(): SWEBenchRow[] {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "lib/ingestion/fixtures/swe-bench.json"), "utf8"),
  ) as SWEBenchRow[];
}

export const sweBenchAdapter: Adapter = {
  name: "swe-bench",
  coverage: ["code"],
  description: "SWE-bench Verified leaderboard scores. Code category only, capability cross-check.",

  async fetchAndNormalize(): Promise<NormalizedRecord[]> {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive() : fetchMock();
    const measurementDate = firstOfMonth();
    return rows.map<NormalizedRecord>((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: "code",
        sourceName: SOURCE_NAME,
        measurementDate,
      });
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: r.openWeight ?? false,

        category: "code",
        taskClass: "code_swe_task",
        energyUnit: "wh_per_coding_task",

        energyWh: null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,

        classification: "measured",
        confidence: "high",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: "tool_use",
        trainingOrInference: "inference",
        standardizedConditions: { benchmark: "swe-bench", suite: "verified" },

        compositeRank: null,
        inTop20: false,
        scaffold: r.scaffold,
        sweVerified: r.sweVerified,
        swePro: r.swePro ?? null,

        status: "active",
        statusNote: null,
        utilityScore: `SWE-bench Verified: ${r.sweVerified}${r.swePro != null ? ` / Pro: ${r.swePro}` : ""}`,
        notes: `Ingested from SWE-bench Verified leaderboard on ${new Date().toISOString().slice(0, 10)}.`,

        sourceFingerprint: fp,
      };
    });
  },
};
