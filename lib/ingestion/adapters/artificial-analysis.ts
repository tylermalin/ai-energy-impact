/**
 * adapters/artificial-analysis.ts
 *
 * Artificial Analysis (https://artificialanalysis.ai/). Covers text,
 * image, video. Source data is pricing + throughput, not direct energy.
 * This adapter DERIVES energy from:
 *
 *   energyWh = (cost_per_token_usd / cloud_price_per_token_usd) × cloud_energy_per_token_wh
 *
 * The derivation uses documented assumptions (see DERIVATION CONSTANTS
 * below). Real adapter would pull live pricing + throughput; here we
 * use a mock fixture.
 *
 * classification = "derived"
 * confidence = "medium-low"
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface AARow {
  modelName: string;
  vendor: string;
  category: "text" | "image" | "video";
  // Pricing inputs (USD per 1M tokens, or per image, or per video-second)
  pricePerUnitUsd: number;
  unitsPerInference: number;          // e.g. avg tokens per prompt
  inferredHardware?: string;
}

const SOURCE_NAME = "Artificial Analysis";
const SOURCE_URL = "https://artificialanalysis.ai/";

/* -------- DERIVATION CONSTANTS (Phase 3 working values) -------- */
// Hyperscaler reference: $4.00 per 1M tokens ≈ 0.30 Wh per 1M tokens
// (extrapolated from Google Cloud's median 0.24 Wh / prompt at ~800 tok).
// These are working assumptions — should be revisited quarterly.
const REFERENCE_PRICE_PER_M_TOKENS_USD = 4.00;
const REFERENCE_WH_PER_TOKEN = 0.30 / 1_000_000;  // 3e-7 Wh per token at the reference price
// For image/video, use cloud per-image / per-second prices from Stability/Replicate as anchors.
const REFERENCE_WH_PER_IMAGE = 0.7685;        // matches Stable Diffusion 3 ML.Energy measurement
const REFERENCE_PRICE_PER_IMAGE_USD = 0.04;
const REFERENCE_WH_PER_VIDEO_SECOND = 30.0;   // conservative midpoint for diffusion video
const REFERENCE_PRICE_PER_VIDEO_SECOND_USD = 0.50;

function deriveEnergyWh(r: AARow): number {
  switch (r.category) {
    case "image":
      return (r.pricePerUnitUsd / REFERENCE_PRICE_PER_IMAGE_USD) * REFERENCE_WH_PER_IMAGE;
    case "video":
      return (r.pricePerUnitUsd / REFERENCE_PRICE_PER_VIDEO_SECOND_USD) * REFERENCE_WH_PER_VIDEO_SECOND;
    default: {
      // text: pricePerUnitUsd is USD per 1M tokens; unitsPerInference is tokens.
      // priceRatio = pricePerUnit / referencePrice  (both are USD per 1M tokens)
      // whPerToken = REFERENCE_WH_PER_TOKEN * priceRatio  (already per-token, no scale)
      // whPerInference = whPerToken * tokens
      const priceRatio = r.pricePerUnitUsd / REFERENCE_PRICE_PER_M_TOKENS_USD;
      const whPerToken = REFERENCE_WH_PER_TOKEN * priceRatio;
      return whPerToken * r.unitsPerInference;
    }
  }
}

function deriveTaskClass(c: AARow["category"]): NormalizedRecord["taskClass"] {
  if (c === "image") return "image_diffusion";
  if (c === "video") return "video_generation";
  return "text_generation";
}
function deriveEnergyUnit(c: AARow["category"]): NormalizedRecord["energyUnit"] {
  if (c === "image") return "wh_per_image";
  if (c === "video") return "wh_per_video_second";
  return "wh_per_inference";
}

async function fetchLive(): Promise<AARow[]> {
  throw new Error("artificial-analysis: live HTTP not yet implemented");
}
function fetchMock(): AARow[] {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "lib/ingestion/fixtures/artificial-analysis.json"), "utf8"),
  ) as AARow[];
}

export const artificialAnalysisAdapter: Adapter = {
  name: "artificial-analysis",
  coverage: ["text", "image", "video"],
  description:
    "Artificial Analysis pricing + throughput → derived energy. Pricing × reference cost/energy ratio per category.",

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
      const wh = deriveEnergyWh(r);
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: false,

        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),

        energyWh: wh,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,

        classification: "derived",
        confidence: "medium-low",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: r.inferredHardware ?? null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: "single_turn_chat",
        trainingOrInference: "inference",
        standardizedConditions: null,

        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,

        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: `Derived from Artificial Analysis pricing on ${new Date().toISOString().slice(0, 10)}. Formula: pricePerUnit × (reference Wh / reference price).`,

        sourceFingerprint: fp,
      };
    });
  },
};
