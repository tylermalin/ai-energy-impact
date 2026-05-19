/**
 * adapters/huggingface-energy-score.ts
 *
 * Hugging Face AI Energy Score (Sasha Luccioni's leaderboard).
 * Covers text, image, code (limited). Emits MEASURED energy values
 * on disclosed hardware.
 *
 * Source: https://huggingface.co/spaces/EnergyStarAI/2024_leaderboard
 *
 * Live HTTP: the leaderboard is a Streamlit-style HF Space that doesn't
 * expose a clean JSON API. Real implementation would scrape the
 * embedded JS data island or use the underlying Code Carbon CSV
 * exports (Sasha publishes them periodically). For Phase 3 we ship
 * with a small mock fixture; flip USE_LIVE_HTTP=1 once a scraper is
 * written.
 *
 * classification = "measured"
 * confidence = "medium"
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface HFRow {
  modelName: string;
  vendor: string;
  category: "text" | "image" | "code";
  energyWh: number;
  energyWhMin?: number;
  energyWhMax?: number;
  hardware: string;
  contextLength?: number;
  batchSize?: number;
  measurementDateIso?: string;
}

const SOURCE_NAME = "Hugging Face AI Energy Score";
const SOURCE_URL = "https://huggingface.co/spaces/EnergyStarAI/2024_leaderboard";

function deriveTaskClass(c: HFRow["category"]): NormalizedRecord["taskClass"] {
  switch (c) {
    case "image": return "image_diffusion";
    case "code":  return "code_swe_task";
    default:      return "text_generation";
  }
}
function deriveEnergyUnit(c: HFRow["category"]): NormalizedRecord["energyUnit"] {
  switch (c) {
    case "image": return "wh_per_image";
    case "code":  return "wh_per_coding_task";
    default:      return "wh_per_inference";
  }
}

async function fetchLive(): Promise<HFRow[]> {
  // Real scrape would target the embedded JSON on the HF space page.
  throw new Error("huggingface-energy-score: live HTTP not yet implemented");
}
function fetchMock(): HFRow[] {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "lib/ingestion/fixtures/huggingface-energy-score.json"), "utf8"),
  ) as HFRow[];
}

export const huggingfaceEnergyScoreAdapter: Adapter = {
  name: "huggingface-energy-score",
  coverage: ["text", "image", "code"],
  description: "Hugging Face AI Energy Score leaderboard (Sasha Luccioni). Measured energy on H100.",

  async fetchAndNormalize(): Promise<NormalizedRecord[]> {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive() : fetchMock();
    return rows.map<NormalizedRecord>((r) => {
      const measurementDate = r.measurementDateIso ? new Date(r.measurementDateIso) : firstOfMonth();
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
        openWeight: true,

        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),

        energyWh: r.energyWh,
        energyWhMin: r.energyWhMin ?? null,
        energyWhMax: r.energyWhMax ?? null,
        carbonGCO2e: null,
        waterMl: null,

        classification: "measured",
        confidence: "medium",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: r.hardware,
        softwareVersion: null,
        contextLength: r.contextLength ?? null,
        batchSize: r.batchSize ?? null,
        promptClass: "single_turn_chat",
        trainingOrInference: "inference",
        standardizedConditions:
          r.category === "image" ? { resolution: "1024x1024", steps: 30 } : null,

        compositeRank: null,
        inTop20: false,

        scaffold: null,
        sweVerified: null,
        swePro: null,

        status: "active",
        statusNote: null,

        utilityScore: null,
        notes: `Ingested from Hugging Face AI Energy Score on ${new Date().toISOString().slice(0, 10)}.`,

        sourceFingerprint: fp,
      };
    });
  },
};
