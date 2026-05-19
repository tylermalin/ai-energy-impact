/**
 * adapters/aico2-estimator.ts
 *
 * Mālama AICo2 Methodology estimation adapter. Runs LAST in the
 * adapter chain. For every (modelName, category) pair that has no
 * energyWh value from any other source, computes an estimate via the
 * 5-stage AICo2 pipeline and inserts a new row.
 *
 * classification = "estimated"
 * confidence     = per the τ-table confidence (high / medium / low)
 *
 * Run only after the other adapters have populated the DB so we know
 * which rows still need coverage.
 */

import { eq, isNotNull } from "drizzle-orm";
import { getDb } from "../../../server/_core/db-client";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import {
  deriveDownstream,
  estimateEnergy,
} from "../../methodology/aico2";
import {
  INDUSTRY_AVERAGE_WUE_L_PER_KWH,
  METHODOLOGY_VERSION,
  TAU_TABLE,
  US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
} from "../../methodology/constants";
import { modelEnergyRecords } from "../../../drizzle/schema";
import type { Adapter, NormalizedRecord } from "../types";

const SOURCE_NAME = "Mālama AICo2 (estimated)";
const SOURCE_URL = "https://aipower.fyi/methodology";

/**
 * Picks a single seed row per (modelName, category) to base the estimate on.
 * Prefers rows that already carry identity (vendor, parameters, scaffold).
 */
async function findGapPairs(): Promise<
  Array<{
    modelName: string;
    category: "text" | "image" | "video" | "code" | "audio" | "other";
    taskClass: string;
    vendor: string;
    parameters: string | null;
    scaffold: string | null;
    openWeight: boolean;
    compositeRank: number | null;
    inTop20: boolean;
  }>
> {
  const db = getDb();
  const all = await db.select().from(modelEnergyRecords);

  // Group by (modelName, category) and check if ANY row has energy.
  type Group = {
    rows: typeof all;
    hasEnergy: boolean;
  };
  const groups = new Map<string, Group>();
  for (const row of all) {
    const key = `${row.modelName}::${row.category}`;
    const g = groups.get(key);
    if (g) {
      g.rows.push(row);
      if (row.energyWh != null) g.hasEnergy = true;
    } else {
      groups.set(key, { rows: [row], hasEnergy: row.energyWh != null });
    }
  }

  // Only audio + the four primary categories qualify; "other" is excluded
  // (these are translation / time-series / fine-tuned classifiers — the
  // task-class table doesn't model them and conservative estimates would
  // just be misleading).
  const primary = new Set(["text", "image", "video", "code", "audio"]);

  const gaps: Awaited<ReturnType<typeof findGapPairs>> = [];
  // Array.from() to avoid downlevelIteration constraint on Map.values()
  for (const group of Array.from(groups.values())) {
    if (group.hasEnergy) continue;
    const seed = group.rows[0];
    if (!primary.has(seed.category)) continue;
    gaps.push({
      modelName: seed.modelName,
      category: seed.category,
      taskClass: seed.taskClass,
      vendor: seed.vendor,
      parameters: seed.parameters,
      scaffold: seed.scaffold,
      openWeight: seed.openWeight,
      compositeRank: seed.compositeRank,
      inTop20: seed.inTop20,
    });
  }
  return gaps;
}

function deriveEnergyUnit(category: string): NormalizedRecord["energyUnit"] {
  switch (category) {
    case "image": return "wh_per_image";
    case "video": return "wh_per_video_second";
    case "code": return "wh_per_coding_task";
    default: return "wh_per_inference";
  }
}

function deriveTaskClass(category: string): NormalizedRecord["taskClass"] {
  switch (category) {
    case "image": return "image_diffusion";
    case "video": return "video_generation";
    case "code": return "code_swe_task";
    case "audio": return "audio_asr";
    default: return "text_generation";
  }
}

/**
 * Preserve a seed row's taskClass if it carries specific information
 * (reasoning / agentic_workflow) that we'd lose by re-deriving from
 * the category. Falls back to the per-category default otherwise.
 */
function resolveTaskClass(
  category: string,
  seedTaskClass: string | null | undefined,
): NormalizedRecord["taskClass"] {
  if (
    seedTaskClass === "reasoning" ||
    seedTaskClass === "agentic_workflow" ||
    seedTaskClass === "translation" ||
    seedTaskClass === "classification" ||
    seedTaskClass === "detection"
  ) {
    return seedTaskClass;
  }
  return deriveTaskClass(category);
}

export const aico2EstimatorAdapter: Adapter = {
  name: "aico2-estimator",
  coverage: ["text", "image", "video", "code"],
  description:
    "Mālama AICo2 Methodology Phase 1 estimator. Fills energy gaps using FLOPs × τ × hardware × facility × PUE. Always runs LAST.",

  async fetchAndNormalize(): Promise<NormalizedRecord[]> {
    const gaps = await findGapPairs();
    // eslint-disable-next-line no-console
    console.log(`[aico2-estimator] Found ${gaps.length} (model, category) pairs missing energy data.`);

    const measurementDate = firstOfMonth();
    const records: NormalizedRecord[] = [];

    for (const gap of gaps) {
      // Skip "other" — methodology doesn't model these task classes well.
      if (gap.category === "other") continue;
      // Skip audio in v1 — the methodology covers Phase 1 for text/image/video
      // primarily; audio_asr energy is low and adds noise.
      if (gap.category === "audio") continue;

      const estimate = estimateEnergy({
        modelName: gap.modelName,
        category: gap.category as "text" | "image" | "video" | "code",
        taskClass: gap.taskClass,
        scaffold: gap.scaffold,
        vendor: gap.vendor,
      });

      const downstream = deriveDownstream(
        estimate.energyWh,
        US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
        INDUSTRY_AVERAGE_WUE_L_PER_KWH,
      );

      const tauConfidence = TAU_TABLE[estimate.taskClassKey].confidence;

      const fp = makeFingerprint({
        modelName: gap.modelName,
        category: gap.category,
        sourceName: SOURCE_NAME,
        measurementDate,
      });

      records.push({
        modelName: gap.modelName,
        modelFamily: gap.modelName.split(/[\s/-]/)[0] ?? gap.modelName,
        modelVersion: null,
        vendor: gap.vendor,
        parameters: gap.parameters ?? `${estimate.parametersB}B (${estimate.parametersBSource})`,
        openWeight: gap.openWeight,

        category: gap.category as NormalizedRecord["category"],
        taskClass: resolveTaskClass(gap.category, gap.taskClass),
        energyUnit: deriveEnergyUnit(gap.category),

        energyWh: estimate.energyWh,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: downstream.carbonGCO2e,
        waterMl: downstream.waterMl,

        classification: "estimated",
        confidence: tauConfidence,
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: `Mālama AICo2 Methodology Green Paper v1.0 (2026-04). Derivation: ${estimate.derivation}.`,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: estimate.hardwareClass === "Unknown" ? null : estimate.hardwareClass,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions:
          gap.category === "image"
            ? { resolution: "1024x1024", steps: 25 }
            : gap.category === "video"
              ? { resolution: "720p", duration_seconds: 5 }
              : gap.category === "code"
                ? { benchmark: "swe-bench", suite: "verified" }
                : null,

        // Preserve ranking from the seed row.
        compositeRank: gap.compositeRank,
        inTop20: gap.inTop20,

        scaffold: gap.scaffold,
        sweVerified: null,
        swePro: null,

        status: "active",
        statusNote: null,
        utilityScore: null,
        notes:
          `AICo2 v1.0 estimate. Task class: ${estimate.taskClassKey}. ` +
          `Parameters: ${estimate.parametersB}B (${estimate.parametersBSource}). ` +
          `${estimate.derivation}. ${downstream.derivation}`,

        // AICo2 audit fields
        tauApplied: estimate.tauApplied,
        fApplied: estimate.fApplied,
        pueApplied: estimate.pueApplied,
        gridIntensityGCO2ePerKWh: downstream.gridIntensityGCO2ePerKWh,
        wueLPerKWh: downstream.wueLPerKWh,
        facilityClass: estimate.facilityClass,
        hardwareClass: estimate.hardwareClass,
        methodologyVersion: METHODOLOGY_VERSION,
        energyWhP10: null,
        energyWhP90: null,
        carbonGCO2eP10: null,
        carbonGCO2eP90: null,
        waterMlP10: null,
        waterMlP90: null,

        sourceFingerprint: fp,
      });
    }
    return records;
  },
};

// keep an unused import alive in case a future revision wants to filter on
// isNotNull(energyWh) within the gap query directly.
void isNotNull;
void eq;
