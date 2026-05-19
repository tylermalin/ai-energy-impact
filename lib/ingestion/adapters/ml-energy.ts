/**
 * adapters/ml-energy.ts
 *
 * ML.Energy benchmark releases. Covers text, image, video.
 * MEASURED energy on H100.
 *
 * Source: https://ml.energy/ (CMU's ML.Energy project)
 *
 * Live: ML.Energy publishes periodic CSV exports. Real adapter would
 * fetch the latest dated CSV, parse with a CSV lib, and emit. For
 * Phase 3 we ship a small mock fixture.
 *
 * classification = "measured"
 * confidence = "medium"
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface MLERow {
  modelName: string;
  vendor: string;
  category: "text" | "image" | "video";
  energyWh: number;
  energyWhMin?: number;
  energyWhMax?: number;
  carbonGCO2e?: number;
  waterMl?: number;
  hardware: string;
  batchSize?: number;
}

const SOURCE_NAME = "ML.Energy";
const SOURCE_URL = "https://ml.energy/";

function deriveTaskClass(c: MLERow["category"]): NormalizedRecord["taskClass"] {
  if (c === "image") return "image_diffusion";
  if (c === "video") return "video_generation";
  return "text_generation";
}
function deriveEnergyUnit(c: MLERow["category"]): NormalizedRecord["energyUnit"] {
  if (c === "image") return "wh_per_image";
  if (c === "video") return "wh_per_video_second";
  return "wh_per_inference";
}

async function fetchLive(): Promise<MLERow[]> {
  throw new Error("ml-energy: live CSV fetch not yet implemented");
}
function fetchMock(): MLERow[] {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), "lib/ingestion/fixtures/ml-energy.json"), "utf8"),
  ) as MLERow[];
}

export const mlEnergyAdapter: Adapter = {
  name: "ml-energy",
  coverage: ["text", "image", "video"],
  description: "ML.Energy benchmark releases (CMU). Measured energy on H100.",

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
        openWeight: true,

        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),

        energyWh: r.energyWh,
        energyWhMin: r.energyWhMin ?? null,
        energyWhMax: r.energyWhMax ?? null,
        carbonGCO2e: r.carbonGCO2e ?? null,
        waterMl: r.waterMl ?? null,

        classification: "measured",
        confidence: "medium",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: r.hardware,
        softwareVersion: null,
        contextLength: null,
        batchSize: r.batchSize ?? null,
        promptClass: "single_turn_chat",
        trainingOrInference: "inference",
        standardizedConditions:
          r.category === "image"
            ? { resolution: "1024x1024", steps: 30 }
            : r.category === "video"
              ? { resolution: "720p", duration_seconds: 5 }
              : null,

        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,

        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: `Ingested from ML.Energy on ${new Date().toISOString().slice(0, 10)}.`,

        sourceFingerprint: fp,
      };
    });
  },
};
