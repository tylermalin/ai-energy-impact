/**
 * adapters/lmarena.ts
 *
 * lmarena.ai (Chatbot Arena / Image Arena / Video Arena / Code Arena).
 * Capability cross-check across all 4 categories. NOT a primary ranking
 * source — feeds in as a secondary check on BenchLM's compositeRank.
 *
 * For Phase 3 the adapter emits records with NO energy data, low
 * confidence, and DOES NOT set compositeRank — that's BenchLM's job.
 * Instead it provides arenaElo and arenaRank in notes for cross-ref.
 *
 * classification = "estimated" (capability-only is "estimated" from
 * an energy-attribution standpoint; the Elo itself is empirical)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface LMArenaRow {
  modelName: string;
  vendor: string;
  category: "text" | "image" | "video" | "code";
  arenaElo: number;
  arenaRank: number;
  openWeight?: boolean;
}

const SOURCE_NAME = "lmarena.ai";
const SOURCE_URL = "https://lmarena.ai/";

function deriveTaskClass(c: LMArenaRow["category"]): NormalizedRecord["taskClass"] {
  switch (c) {
    case "image": return "image_diffusion";
    case "video": return "video_generation";
    case "code":  return "code_swe_task";
    default:      return "text_generation";
  }
}
function deriveEnergyUnit(c: LMArenaRow["category"]): NormalizedRecord["energyUnit"] {
  switch (c) {
    case "image": return "wh_per_image";
    case "video": return "wh_per_video_second";
    case "code":  return "wh_per_coding_task";
    default:      return "wh_per_inference";
  }
}

async function fetchLive(): Promise<LMArenaRow[]> {
  // lmarena.ai exposes per-category leaderboards as HTML; the underlying data
  // is JSON in a Next.js __NEXT_DATA__ payload. Real adapter would extract it.
  throw new Error("lmarena: live HTTP not yet implemented");
}
function fetchMock(): LMArenaRow[] {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "lib/ingestion/fixtures/lmarena.json"), "utf8"),
  ) as LMArenaRow[];
}

export const lmarenaAdapter: Adapter = {
  name: "lmarena",
  coverage: ["text", "image", "video", "code"],
  description: "lmarena.ai Arena Elo across categories. Capability cross-check; no energy data.",

  async fetchAndNormalize(): Promise<NormalizedRecord[]> {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive() : fetchMock();
    const measurementDate = firstOfMonth();
    return rows.map<NormalizedRecord>((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
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

        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),

        energyWh: null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,

        classification: "estimated",
        confidence: "low",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions: null,

        // We intentionally do NOT set compositeRank here — BenchLM is the
        // primary ranking source. We expose Arena Elo + rank via notes.
        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,

        status: "active",
        statusNote: null,
        utilityScore: `Arena Elo: ${r.arenaElo} (rank #${r.arenaRank} in ${r.category})`,
        notes: `Cross-check from lmarena.ai on ${new Date().toISOString().slice(0, 10)}. Arena Elo ${r.arenaElo}, rank #${r.arenaRank} in ${r.category} category.`,

        sourceFingerprint: fp,
      };
    });
  },
};
