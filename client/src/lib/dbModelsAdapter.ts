/**
 * client/src/lib/dbModelsAdapter.ts
 *
 * Converts a deduped MySQL model_energy_records row (as returned by the
 * cms.modelsForDashboard tRPC query) into the DisplayModel shape that
 * DataExplorer renders.
 *
 * Pairs with modelsAdapter.ts (which adapts the legacy hardcoded rows
 * for the dev/no-DB fallback path). Both produce DisplayModel — only
 * the source differs.
 */

import type { DisplayModel, DisplayCategory, EnergyUnit } from "./modelsAdapter";
import type {
  Classification,
  Confidence,
} from "../../../shared/lib/provenance";

/**
 * The shape the tRPC query returns (subset of ModelEnergyRecord we
 * actually consume on the client). Mirroring the Drizzle row keeps the
 * type stable as the schema evolves; superjson on the server preserves
 * Date instances across the wire.
 */
export interface DbRow {
  id: number;
  modelName: string;
  modelFamily: string;
  modelVersion: string | null;
  vendor: string;
  parameters: string | null;
  openWeight: boolean;

  category: string;
  taskClass: string;
  energyUnit: string;

  energyWh: number | null;
  energyWhMin: number | null;
  energyWhMax: number | null;
  carbonGCO2e: number | null;
  waterMl: number | null;

  classification: string;
  confidence: string;
  sourceName: string;
  sourceUrl: string;
  sourceCitation: string | null;
  measurementDate: string | Date;
  lastVerifiedAt: string | Date;

  hardware: string | null;
  softwareVersion: string | null;
  contextLength: number | null;
  batchSize: number | null;
  promptClass: string | null;
  trainingOrInference: string;

  compositeRank: number | null;
  inTop20: boolean;

  scaffold: string | null;
  sweVerified: number | null;
  swePro: number | null;

  status: string;
  statusNote: string | null;

  utilityScore: string | null;
  notes: string | null;

  // AICo2 audit fields (Phase 3b)
  tauApplied: number | null;
  fApplied: number | null;
  pueApplied: number | null;
  gridIntensityGCO2ePerKWh: number | null;
  wueLPerKWh: number | null;
  facilityClass: string | null;
  hardwareClass: string | null;
  methodologyVersion: string | null;
}

function toDate(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  return typeof v === "string" ? v : v.toISOString();
}

function clampCategory(c: string): DisplayCategory {
  switch (c) {
    case "text":
    case "image":
    case "video":
    case "code":
    case "audio":
    case "other":
      return c;
    default:
      return "other";
  }
}
function clampEnergyUnit(u: string): EnergyUnit {
  switch (u) {
    case "wh_per_inference":
    case "wh_per_image":
    case "wh_per_video_second":
    case "wh_per_coding_task":
      return u;
    default:
      return "wh_per_inference";
  }
}
function clampClassification(c: string): Classification {
  return c === "measured" || c === "derived" || c === "estimated" ? c : "estimated";
}
function clampConfidence(c: string): Confidence {
  return c === "high" || c === "medium" || c === "medium-low" || c === "low" ? c : "low";
}
function clampTrainingOrInference(v: string): "inference" | "training" | "both" {
  return v === "training" || v === "both" ? v : "inference";
}
function clampStatus(v: string): "active" | "sunsetting" | "deprecated" {
  return v === "sunsetting" || v === "deprecated" ? v : "active";
}

export function adaptDbRow(r: DbRow): DisplayModel {
  // Build a sortable energy value: prefer the explicit max, then the
  // point estimate, then 0 (sorts to bottom). Mirrors what
  // modelsAdapter.ts does for the legacy rows.
  const energyForSort = r.energyWhMax ?? r.energyWh ?? 0;

  // Build a display-friendly range string if min/max differ.
  let energyRangeRaw: string | null = null;
  if (r.energyWhMin != null && r.energyWhMax != null && r.energyWhMin !== r.energyWhMax) {
    energyRangeRaw = `${r.energyWhMin} – ${r.energyWhMax}`;
  } else if (r.energyWh != null) {
    energyRangeRaw = `${r.energyWh}`;
  }

  return {
    id: `db-${r.id}`,
    modelName: r.modelName,
    modelFamily: r.modelFamily,
    vendor: r.vendor,
    parameters: r.parameters,
    openWeight: r.openWeight,

    category: clampCategory(r.category),
    taskClass: r.taskClass,
    energyUnit: clampEnergyUnit(r.energyUnit),

    energyWh: r.energyWh,
    energyWhMin: r.energyWhMin,
    energyWhMax: r.energyWhMax,
    carbonGCO2e: r.carbonGCO2e,
    waterMl: r.waterMl,

    classification: clampClassification(r.classification),
    confidence: clampConfidence(r.confidence),
    sourceName: r.sourceName,
    sourceUrl: r.sourceUrl,
    measurementDate: toDate(r.measurementDate),
    lastVerifiedAt: toDate(r.lastVerifiedAt),

    hardware: r.hardware,
    softwareVersion: r.softwareVersion,
    contextLength: r.contextLength,
    batchSize: r.batchSize,
    promptClass: r.promptClass,
    trainingOrInference: clampTrainingOrInference(r.trainingOrInference),

    compositeRank: r.compositeRank,
    inTop20: r.inTop20,

    scaffold: r.scaffold,
    sweVerified: r.sweVerified,
    swePro: r.swePro,

    status: clampStatus(r.status),
    statusNote: r.statusNote,

    utilityScore: r.utilityScore,
    notes: r.notes,

    energyForSort,
    energyRangeRaw,

    // AICo2 audit fields
    tauApplied: r.tauApplied,
    fApplied: r.fApplied,
    pueApplied: r.pueApplied,
    gridIntensityGCO2ePerKWh: r.gridIntensityGCO2ePerKWh,
    wueLPerKWh: r.wueLPerKWh,
    facilityClass: r.facilityClass,
    hardwareClass: r.hardwareClass,
    methodologyVersion: r.methodologyVersion,
  };
}
