/**
 * lib/methodology/aico2.ts
 *
 * Implementation of the Mālama AICo2 Methodology Phase 1 pipeline.
 * See data/Mālama AICo2 Methodology v1.0 (April 2026) for the full
 * specification; all formulas and constants below cite the relevant
 * Section number.
 *
 * Five-stage pipeline (Section 4.1):
 *   1. FLOPs           — 2 × N × T (transformers)
 *   2. Task-class τ    — multiplier per workload type
 *   3. Hardware Wh/1k  — accelerator efficiency
 *   4. Facility F+PUE  — overhead beyond IT equipment
 *   5. Carbon          — Energy × grid intensity
 *   (Plus Section 9.7) Water — Energy × WUE
 */

import {
  DEFAULT_TOKENS_PER_INFERENCE,
  FACILITY_TABLE,
  INDUSTRY_AVERAGE_WUE_L_PER_KWH,
  METHODOLOGY_VERSION,
  MODEL_PARAMETER_OVERRIDES,
  REFERENCE_WH_PER_RESPONSE,
  TAU_TABLE,
  TIER_PARAMETERS_B,
  US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
  VIDEO_F_SUPPLEMENT,
  WH_PER_1K_TOKENS_BY_HARDWARE,
  type FacilityClass,
  type HardwareClass,
  type ModelTier,
  type TaskClassKey,
} from "./constants";

/* ──────────────────────────────────────────────────────────────────
 * Stage 1 — FLOPs (Section 4.1 Stage 1)
 * ────────────────────────────────────────────────────────────────── */

/** FLOPs ≈ 2 × N × T for transformer inference. N in count, T in tokens. */
export function computeFlops(N: number, T: number): number {
  return 2 * N * T;
}

/** Pulls parameter count (in billions) for a model, with tier fallback. */
export function lookupParametersB(modelName: string, fallbackTier: ModelTier = "mid"): {
  N_B: number;
  source: "disclosed" | "tier-estimate" | "tier-fallback";
} {
  const override = MODEL_PARAMETER_OVERRIDES[modelName];
  if (override) return override;
  return { N_B: TIER_PARAMETERS_B[fallbackTier], source: "tier-fallback" };
}

/* ──────────────────────────────────────────────────────────────────
 * Stage 2 — Task-Class τ Lookup (Section 5.1)
 * ────────────────────────────────────────────────────────────────── */

/**
 * Maps a (DB-level) taskClass + category + scaffold combo to a
 * methodology TaskClassKey. The DB enum is broader than the methodology's
 * 7 task classes; this routes them.
 *
 * Examples:
 *   ("text_generation", "text", null)          → text_chat
 *   ("reasoning",       "text", null)          → text_reasoning
 *   ("agentic_workflow","text", null)          → text_agentic_moderate
 *   ("code_swe_task",   "code", "Claude Code") → text_agentic_test_time_scaled
 *   ("image_diffusion", "image", null, 25)     → image_standard_25step
 *   ("image_diffusion", "image", null, 50)     → image_high_quality_50step
 *   ("video_generation","video", null)         → video_short_5s
 */
export function pickTaskClassKey(args: {
  category: string;
  taskClass: string;
  scaffold?: string | null;
  denoisingSteps?: number | null;
}): TaskClassKey {
  const { category, taskClass, scaffold, denoisingSteps } = args;

  if (category === "video") return "video_short_5s";

  if (category === "image") {
    if (denoisingSteps && denoisingSteps >= 40) return "image_high_quality_50step";
    return "image_standard_25step";
  }

  if (category === "code") {
    // Code agents using scaffolds (Claude Code, Codex CLI, etc.) are
    // multi-step agentic workloads with test-time compute. Use the
    // test-time-scaled rate (τ=15, 4.32 Wh/response).
    if (scaffold && scaffold.toLowerCase() !== "open") {
      return "text_agentic_test_time_scaled";
    }
    return "text_agentic_moderate";
  }

  if (taskClass === "reasoning") return "text_reasoning";
  if (taskClass === "agentic_workflow") return "text_agentic_moderate";
  return "text_chat";
}

/** Look up τ for a TaskClassKey. */
export function lookupTau(key: TaskClassKey): number {
  return TAU_TABLE[key].tau;
}

/* ──────────────────────────────────────────────────────────────────
 * Stage 3 — Hardware Efficiency (Section 4.1 Stage 3)
 * ────────────────────────────────────────────────────────────────── */

/** Coerce a free-text hardware string into a known HardwareClass. */
export function classifyHardware(hardware: string | null | undefined): HardwareClass {
  if (!hardware) return "Unknown";
  const h = hardware.toUpperCase();
  if (h.includes("H200")) return "H200";
  if (h.includes("B200")) return "B200";
  if (h.includes("H100")) return "H100";
  if (h.includes("TPU")) return "TPU_v5";
  return "Unknown";
}

/* ──────────────────────────────────────────────────────────────────
 * Stage 4 — Facility F + PUE (Section 4.1 Stage 4)
 * ────────────────────────────────────────────────────────────────── */

export function classifyFacility(vendor: string | null | undefined): FacilityClass {
  if (!vendor) return "unknown";
  const v = vendor.toLowerCase();
  // Hyperscalers known to operate modern PUE 1.1-class facilities.
  if (["google", "openai", "anthropic", "microsoft", "meta", "amazon", "xai"].some((x) => v.includes(x))) {
    return "hyperscale_modern";
  }
  if (["alibaba", "tencent", "bytedance", "kuaishou"].some((x) => v.includes(x))) {
    return "hyperscale_standard";
  }
  return "unknown";
}

/* ──────────────────────────────────────────────────────────────────
 * Energy estimation (Sections 4.1 + 5.2)
 * ────────────────────────────────────────────────────────────────── */

export interface EnergyEstimateInput {
  modelName: string;
  category: "text" | "image" | "video" | "code" | "audio" | "other";
  taskClass: string;
  scaffold?: string | null;
  denoisingSteps?: number | null;
  hardware?: string | null;
  vendor?: string | null;
  /** Override the default token count per task class if known. */
  tokens?: number | null;
}

export interface EnergyEstimateResult {
  energyWh: number;
  // Audit trail per Section 8.1 — every input that flowed into the estimate.
  tauApplied: number;
  fApplied: number;
  pueApplied: number;
  hardwareClass: HardwareClass;
  facilityClass: FacilityClass;
  taskClassKey: TaskClassKey;
  parametersBSource: "disclosed" | "tier-estimate" | "tier-fallback";
  parametersB: number;
  tokensUsed: number;
  /** Plain-English explanation suitable for the row-expand UI. */
  derivation: string;
  /** Methodology fingerprint = which version of AICo2 produced this. */
  methodologyVersion: string;
}

/**
 * Estimate per-inference energy using the AICo2 Phase 1 pipeline.
 *
 * Strategy:
 *   - For image / video: use the reference Wh values (Section 5.2) directly,
 *     then apply facility F × PUE × (video supplement if applicable).
 *   - For text / code: use FLOPs × τ × Wh/1000-tokens-on-hardware × F × PUE.
 *     Falls back to reference Wh values when parameters are unknown.
 */
export function estimateEnergy(input: EnergyEstimateInput): EnergyEstimateResult {
  const taskClassKey = pickTaskClassKey(input);
  const tau = lookupTau(taskClassKey);
  const hardwareClass = classifyHardware(input.hardware);
  const facilityClass = classifyFacility(input.vendor);
  const facility = FACILITY_TABLE[facilityClass];

  let fApplied = facility.f;
  if (input.category === "video") fApplied *= VIDEO_F_SUPPLEMENT;
  const pueApplied = facility.pue;

  let energyWh: number;
  let parametersB = 0;
  let parametersBSource: "disclosed" | "tier-estimate" | "tier-fallback" = "tier-fallback";
  let tokensUsed = 0;
  let derivation: string;

  if (input.category === "image" || input.category === "video") {
    // Reference values include 2× server overhead per Section 5.2.
    // The reference already encapsulates τ for that workload class, so
    // we do NOT multiply by τ again — we just apply facility adjustments.
    const refWh = REFERENCE_WH_PER_RESPONSE[taskClassKey];
    energyWh = refWh * (fApplied / 2.0) * pueApplied;
    derivation =
      `${input.category === "video" ? "Video" : "Image"} reference ${refWh} Wh ` +
      `(${taskClassKey}, τ=${tau} encapsulated) ` +
      `× facility F/2 (${(fApplied / 2).toFixed(2)}) × PUE (${pueApplied})`;
  } else {
    // Text / code: prefer FLOPs × τ × Wh/1000-tok when we have N.
    const paramLookup = lookupParametersB(input.modelName);
    parametersB = paramLookup.N_B;
    parametersBSource = paramLookup.source;
    tokensUsed = input.tokens ?? DEFAULT_TOKENS_PER_INFERENCE[taskClassKey];
    const whPer1k = WH_PER_1K_TOKENS_BY_HARDWARE[hardwareClass];

    // Wh ≈ (N_B / 70) × (tokens / 1000) × whPer1k × τ
    // The (N_B / 70) factor normalizes against the 70B reference model
    // implicit in the whPer1k anchor (Section 4.1 Stage 3).
    const sizeScaling = parametersB / 70;
    const energyIT_Wh = sizeScaling * (tokensUsed / 1000) * whPer1k * tau;
    energyWh = energyIT_Wh * fApplied * pueApplied;
    derivation =
      `${parametersB}B params (${paramLookup.source}) × ${tokensUsed} tokens × ` +
      `${whPer1k} Wh/1k (${hardwareClass}) × τ (${tau}) × F (${fApplied.toFixed(2)}) × PUE (${pueApplied})`;
  }

  return {
    energyWh,
    tauApplied: tau,
    fApplied,
    pueApplied,
    hardwareClass,
    facilityClass,
    taskClassKey,
    parametersBSource,
    parametersB,
    tokensUsed,
    derivation,
    methodologyVersion: METHODOLOGY_VERSION,
  };
}

/* ──────────────────────────────────────────────────────────────────
 * Stage 5 — Carbon Conversion (Section 4.1 Stage 5)
 * ────────────────────────────────────────────────────────────────── */

export function computeCarbonGCO2e(
  energyWh: number,
  gridIntensityGCO2ePerKWh: number = US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
): number {
  // gCO2e = energyKWh × gPerKWh; energyKWh = energyWh / 1000
  return (energyWh / 1000) * gridIntensityGCO2ePerKWh;
}

/* ──────────────────────────────────────────────────────────────────
 * Water Conversion (Section 9.7)
 * ────────────────────────────────────────────────────────────────── */

export function computeWaterMl(
  energyWh: number,
  wueLPerKWh: number = INDUSTRY_AVERAGE_WUE_L_PER_KWH,
): number {
  // L per kWh × (Wh / 1000) = L → × 1000 = mL.  So mL = energyWh × WUE.
  return energyWh * wueLPerKWh;
}

/* ──────────────────────────────────────────────────────────────────
 * Bundled "downstream conversion" — when a third party gave us energy,
 * apply AICo2 grid + WUE to compute carbon and water.
 * ────────────────────────────────────────────────────────────────── */

export interface DownstreamConversionResult {
  carbonGCO2e: number;
  waterMl: number;
  gridIntensityGCO2ePerKWh: number;
  wueLPerKWh: number;
  methodologyVersion: string;
  derivation: string;
}

export function deriveDownstream(
  energyWh: number,
  gridIntensity: number = US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
  wue: number = INDUSTRY_AVERAGE_WUE_L_PER_KWH,
): DownstreamConversionResult {
  return {
    carbonGCO2e: computeCarbonGCO2e(energyWh, gridIntensity),
    waterMl: computeWaterMl(energyWh, wue),
    gridIntensityGCO2ePerKWh: gridIntensity,
    wueLPerKWh: wue,
    methodologyVersion: METHODOLOGY_VERSION,
    derivation:
      `Carbon = ${energyWh.toFixed(4)} Wh × ${gridIntensity} gCO₂e/kWh ÷ 1000. ` +
      `Water = ${energyWh.toFixed(4)} Wh × ${wue} L/kWh.`,
  };
}
