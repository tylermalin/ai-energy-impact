/**
 * adapters/system-cards.ts
 *
 * Manual-assist adapter. Does NOT auto-fetch. Reads
 * `data/system-cards.yaml`, where humans paste vendor-published system
 * card data when new ones drop (OpenAI, Anthropic, Google, Meta).
 *
 * If `reportedEnergyWh` is provided in the YAML, classification = "estimated"
 * (vendor self-report). If `derivationMethod` is set without a reported
 * energy, classification = "derived" (we computed it from pricing +
 * throughput per the documented method).
 *
 * confidence: vendor-reported -> "medium-low"; derived -> "low"
 *
 * Covers all 4 categories — the YAML row's category drives routing.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface SystemCardRow {
  modelName: string;
  vendor: string;
  category: "text" | "image" | "video" | "code";
  systemCardUrl: string;
  publishedDate: string;                // YYYY-MM-DD
  reportedEnergyWh?: number | null;
  derivationMethod?: string | null;     // e.g. "pricing+throughput"
  hardwareAssumption?: string | null;
  parameters?: string | null;
  notes?: string | null;
}

const SOURCE_NAME = "Vendor system card";
const YAML_PATH = "data/system-cards.yaml";

function deriveTaskClass(c: SystemCardRow["category"]): NormalizedRecord["taskClass"] {
  switch (c) {
    case "image": return "image_diffusion";
    case "video": return "video_generation";
    case "code":  return "code_swe_task";
    default:      return "text_generation";
  }
}
function deriveEnergyUnit(c: SystemCardRow["category"]): NormalizedRecord["energyUnit"] {
  switch (c) {
    case "image": return "wh_per_image";
    case "video": return "wh_per_video_second";
    case "code":  return "wh_per_coding_task";
    default:      return "wh_per_inference";
  }
}

export const systemCardsAdapter: Adapter = {
  name: "system-cards",
  coverage: ["text", "image", "video", "code"],
  description:
    "Manual: reads data/system-cards.yaml. Vendor-published system cards (OpenAI, Anthropic, Google, Meta).",

  async fetchAndNormalize(): Promise<NormalizedRecord[]> {
    const path = resolve(process.cwd(), YAML_PATH);
    if (!existsSync(path)) {
      // eslint-disable-next-line no-console
      console.log(`[system-cards] ${YAML_PATH} not found — skipping with 0 records.`);
      return [];
    }
    const raw = readFileSync(path, "utf8");
    const parsed = parseYaml(raw) as SystemCardRow[] | null;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    return parsed.map<NormalizedRecord>((r) => {
      const measurementDate = new Date(`${r.publishedDate}T00:00:00Z`);
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME,
        measurementDate,
      });

      const hasReported = r.reportedEnergyWh != null;
      const classification: NormalizedRecord["classification"] = hasReported ? "estimated" : "derived";
      const confidence: NormalizedRecord["confidence"] = hasReported ? "medium-low" : "low";

      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: r.parameters ?? null,
        openWeight: false,

        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),

        energyWh: r.reportedEnergyWh ?? null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,

        classification,
        confidence,
        sourceName: SOURCE_NAME,
        sourceUrl: r.systemCardUrl,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: r.hardwareAssumption ?? null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
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
        notes: r.notes ?? `From ${r.vendor} system card published ${r.publishedDate}. Derivation: ${r.derivationMethod ?? "vendor-reported"}.`,

        sourceFingerprint: fp,
      };
    });
  },
};

// expose the firstOfMonth import so tree-shake doesn't strip the dep when
// the YAML is empty. (No-op at runtime.)
void firstOfMonth;
