/**
 * lib/methodology/constants.ts
 *
 * All lookup tables and reference constants from the Mālama AICo2
 * Methodology Green Paper (April 2026).
 *
 * SECTION REFERENCES below cite the methodology PDF directly. If the
 * PDF is updated, this file must be re-synced.
 *
 * Source: data/Mālama AICo2 Methodology v1.0 (2026-04)
 */

export const METHODOLOGY_VERSION = "AICo2-v1.0-2026-04";

/* ──────────────────────────────────────────────────────────────────
 * Task-Class Multipliers (τ) — Section 5.1
 * ────────────────────────────────────────────────────────────────── */

export type TaskClassKey =
  | "text_chat"
  | "text_reasoning"
  | "text_agentic_moderate"
  | "text_agentic_test_time_scaled"
  | "image_standard_25step"
  | "image_high_quality_50step"
  | "video_short_5s";

export interface TauEntry {
  /** τ multiplier vs the text-chat baseline (1.0). */
  tau: number;
  /** Confidence per Section 5.5 */
  confidence: "high" | "medium" | "medium-low" | "low";
  /** Primary energy driver (Section 5.1) */
  driver: string;
  /** Notes (Section 5.3) */
  notes: string;
}

export const TAU_TABLE: Record<TaskClassKey, TauEntry> = {
  text_chat: {
    tau: 1.0,
    confidence: "high",
    driver: "Token count, model size",
    notes: "Calibration baseline. FLOPs formula reliable.",
  },
  text_reasoning: {
    tau: 24, // midpoint of 23-25× range
    confidence: "medium",
    driver: "Token inflation + KV cache pressure + batch degradation",
    notes:
      "Chain-of-thought / o1-class. Token inflation 10× × batch efficiency loss = 23–25× total.",
  },
  text_agentic_moderate: {
    tau: 14, // midpoint of 13-15× range
    confidence: "medium-low",
    driver: "Sequential inference passes, token multiplication up to 15×",
    notes: "Default for agentic workflows without test-time compute scaling.",
  },
  text_agentic_test_time_scaled: {
    tau: 15,
    confidence: "low",
    driver: "Sequential passes + test-time compute multiplication",
    notes:
      "15× the chat baseline yields ~4.32 Wh (matching the agentic-AI legacy figure).",
  },
  image_standard_25step: {
    tau: 20,
    confidence: "high",
    driver: "Denoising step count and resolution",
    notes:
      "Architecturally distinct from LLMs; FLOPs formula does not directly apply. Use reference Wh value.",
  },
  image_high_quality_50step: {
    tau: 39,
    confidence: "high",
    driver: "Step doubling with non-linear resolution cost",
    notes:
      "2× step increase produces ~1.95× energy (sublinear due to finer gradient resolution).",
  },
  video_short_5s: {
    tau: 30_000,
    confidence: "medium",
    driver: "3D self-attention quadratic cost, temporal denoising",
    notes:
      "5-second clip at 24fps = ~120 frames. Empirically measured. Warrants separate reporting class.",
  },
};

/**
 * Reference Energy Values — Section 5.2
 * "All figures include 2× server overhead multiplier on H100-class hardware."
 *
 * Use these directly for image / video where the FLOPs formula does not
 * apply. For text, prefer FLOPs × τ where N is known; fall back to these
 * reference values when N is unknown.
 */
export const REFERENCE_WH_PER_RESPONSE: Record<TaskClassKey, number> = {
  text_chat: 0.032,                          // 8B chat model baseline (Wh)
  text_reasoning: 0.755,                     // midpoint of 0.72-0.79 Wh
  text_agentic_moderate: 0.86,               // midpoint of 0.42-1.30 Wh
  text_agentic_test_time_scaled: 4.32,       // 15× test-time scaled
  image_standard_25step: 0.63,
  image_high_quality_50step: 1.22,
  video_short_5s: 944,
};

/** Anchor reference: text-chat on 405B model (Section 5.2) = 1.86 Wh */
export const TEXT_CHAT_405B_WH = 1.86;

/* ──────────────────────────────────────────────────────────────────
 * FLOPs Formula — Section 4.1 Stage 1
 *
 *   FLOPs = 2 × N × T
 *   where N = parameter count, T = total tokens (input + output)
 *
 * Joules/FLOP varies by hardware. Anchor: H100-class hardware.
 * Per Section 4.1 Stage 3: B200 = 93% reduction in operational energy.
 * ────────────────────────────────────────────────────────────────── */

/**
 * Energy per FLOP, joules. Anchored to H100-class.
 *
 * Derivation: H100 delivers ~989 TFLOPS at BF16 at ~700W. So
 * J/FLOP ≈ 700 / 989e12 ≈ 7.08e-13 J/FLOP. Real-world utilization
 * pushes this higher; methodology uses configurable Wh per 1000 tokens
 * as the anchor (see below).
 */
export const J_PER_FLOP_H100 = 7.08e-13;

export type HardwareClass = "H100" | "H200" | "B200" | "TPU_v5" | "Unknown";

/**
 * Wh per 1000 tokens, by hardware (Section 4.1 Stage 3).
 * "Configurable Energy per 1,000 tokens (Wh) parameter anchored to
 * H100-class hardware." H100 baseline ~0.04 Wh/1k tok at typical
 * utilization for a 70B model. Scaling factors:
 *   - H200: ~0.93× H100 (modest improvement)
 *   - B200: ~0.07× H100 (93% reduction per the methodology)
 *   - TPU v5: ~0.85× H100 (rough estimate)
 *   - Unknown: 1.0× H100 (conservative)
 */
export const WH_PER_1K_TOKENS_BY_HARDWARE: Record<HardwareClass, number> = {
  H100: 0.04,
  H200: 0.037,
  B200: 0.0028,
  TPU_v5: 0.034,
  Unknown: 0.04,
};

/* ──────────────────────────────────────────────────────────────────
 * Facility-Class Overhead (F) — Section 4.1 Stage 4
 *
 *   Total Facility Energy = IT Equipment Energy × PUE × F
 *
 *   F captures the GPU-to-total-server overhead, ABOVE PUE.
 * ────────────────────────────────────────────────────────────────── */

export type FacilityClass =
  | "hyperscale_modern"
  | "hyperscale_standard"
  | "enterprise"
  | "legacy"
  | "unknown";

export interface FacilityEntry {
  /** F multiplier midpoint */
  f: number;
  /** Range from the methodology table */
  fMin: number;
  fMax: number;
  /** Typical PUE for this class */
  pue: number;
  /** GPU share of server energy */
  gpuShare: string;
}

export const FACILITY_TABLE: Record<FacilityClass, FacilityEntry> = {
  hyperscale_modern: {
    f: 1.13, fMin: 1.08, fMax: 1.18,
    pue: 1.10, gpuShare: "85–93%",
  },
  hyperscale_standard: {
    f: 1.40, fMin: 1.25, fMax: 1.54,
    pue: 1.30, gpuShare: "65–80%",
  },
  enterprise: {
    f: 1.77, fMin: 1.54, fMax: 2.00,
    pue: 1.55, gpuShare: "50–65%",
  },
  legacy: {
    f: 2.20, fMin: 2.00, fMax: 2.50,
    pue: 1.80, gpuShare: "<50%",
  },
  unknown: {
    // Default per Section 4.1 Stage 4: "Default F = 1.54 ... unless
    // facility class is known. ... global average PUE (~1.55)."
    f: 1.54, fMin: 1.25, fMax: 2.00,
    pue: 1.55, gpuShare: "unknown",
  },
};

/**
 * Video supplemental F adjustment per Section 4.1 Stage 4:
 * "Video generation workloads require a supplemental F adjustment of
 * 1.1–1.2× due to distinct thermal and memory profiles."
 */
export const VIDEO_F_SUPPLEMENT = 1.15;

/* ──────────────────────────────────────────────────────────────────
 * Carbon Conversion — Section 4.1 Stage 5
 *
 *   CO₂e (g) = Energy (Wh) × Grid Intensity (gCO₂e/kWh) / 1000
 *
 * Primary signal: location-based average intensity (GHG Protocol Scope 2).
 * Source: Electricity Maps (real-time, consumption-based) preferred;
 * EPA eGRID / IEA as static-annual fallback.
 * ────────────────────────────────────────────────────────────────── */

/** US 2024 consumption-based national average (Section 4.1 Stage 5). */
export const US_2024_GRID_INTENSITY_G_CO2E_PER_KWH = 402.49;

/**
 * Regional defaults for when a workload's region is known but live
 * grid telemetry isn't wired. Values are 2024 annual averages.
 * Phase 2 replaces these with sub-second Electricity Maps integration.
 */
export const REGIONAL_GRID_INTENSITY_DEFAULTS: Record<string, number> = {
  "US-Average": 402.49,
  "US-CAISO": 215,     // California: heavy solar mix
  "US-PJM": 360,       // Virginia: data-center heavy
  "EU-Average": 230,
  "EU-France": 56,     // nuclear-dominated
  "EU-Germany": 380,
  "China-Average": 580,
  "India-Average": 715,
  "Hydro-Dominant": 50,
};

/* ──────────────────────────────────────────────────────────────────
 * Water Conversion — Section 9.7
 *
 *   Water (mL) = Energy (Wh) × WUE (L/kWh)
 *   (units: Wh × L/kWh = mWh × L/kWh × 1000mWh/Wh — same as mL)
 *
 * Industry average WUE = 1.9 L/kWh (Section 9.7).
 * ────────────────────────────────────────────────────────────────── */

export const INDUSTRY_AVERAGE_WUE_L_PER_KWH = 1.9;

/* ──────────────────────────────────────────────────────────────────
 * Model Parameter Lookup (T → tier when N is unknown)
 *
 * Per Section 4.1 Stage 1: "When N is unknown, models are classified
 * by tier (small / mid / large) using industry benchmarks.
 * Classifications are configurable."
 *
 * This table is our working assumption for Top-20 closed models.
 * Update as vendors disclose or as independent estimates emerge.
 * ────────────────────────────────────────────────────────────────── */

export type ModelTier = "small" | "mid" | "large" | "frontier";

export const TIER_PARAMETERS_B: Record<ModelTier, number> = {
  small: 8,        // 8B
  mid: 70,         // 70B
  large: 405,      // 405B
  frontier: 1000,  // 1T (closed frontier models, working assumption)
};

/**
 * Per-model parameter assignments. Values for OPEN-weight models are
 * disclosed by the vendor. Values for closed models are working
 * tier assumptions and should be revisited as evidence emerges.
 */
export const MODEL_PARAMETER_OVERRIDES: Record<string, { N_B: number; source: "disclosed" | "tier-estimate" }> = {
  // Open-weight (disclosed)
  "Llama 3.1 8B": { N_B: 8, source: "disclosed" },
  "Llama 3.1 70B": { N_B: 70, source: "disclosed" },
  "Llama 3.1 405B": { N_B: 405, source: "disclosed" },
  "Llama 4 Scout": { N_B: 109, source: "disclosed" },
  "Mixtral 8x22B": { N_B: 141, source: "disclosed" },     // MoE total
  "Qwen2-72B-Instruct": { N_B: 72, source: "disclosed" },
  "Qwen 3.6 Plus": { N_B: 235, source: "tier-estimate" },
  "Qwen 3.5 0.8B": { N_B: 0.8, source: "disclosed" },
  "DeepSeek V3.2": { N_B: 671, source: "disclosed" },
  "DeepSeek V4 Pro Max": { N_B: 1000, source: "tier-estimate" },
  "GLM-4.7": { N_B: 32, source: "tier-estimate" },
  "GLM-5": { N_B: 200, source: "tier-estimate" },
  "Mistral Medium 3.5": { N_B: 80, source: "tier-estimate" },
  "OLMo 3.1": { N_B: 32, source: "tier-estimate" },
  "Kimi K2.5": { N_B: 1000, source: "tier-estimate" },
  "Kimi K2.6": { N_B: 1000, source: "tier-estimate" },
  "MiniMax M2.5": { N_B: 456, source: "tier-estimate" },
  "BLOOM": { N_B: 176, source: "disclosed" },
  "LLaMA": { N_B: 65, source: "disclosed" },

  // Closed frontier (tier estimates)
  "GPT-4o": { N_B: 200, source: "tier-estimate" },
  "GPT-4.1": { N_B: 1000, source: "tier-estimate" },
  "GPT-4.5": { N_B: 2000, source: "tier-estimate" },
  "GPT-o3": { N_B: 1000, source: "tier-estimate" },
  "GPT-5.3": { N_B: 1500, source: "tier-estimate" },
  "GPT-5.5": { N_B: 1800, source: "tier-estimate" },
  "GPT-5.3-Codex": { N_B: 1500, source: "tier-estimate" },
  "Claude Opus 4.6": { N_B: 1000, source: "tier-estimate" },
  "Claude Opus 4.6 Thinking": { N_B: 1000, source: "tier-estimate" },
  "Claude Opus 4.7": { N_B: 1200, source: "tier-estimate" },
  "Claude Sonnet 4.6": { N_B: 400, source: "tier-estimate" },
  "Claude Mythos Preview": { N_B: 1500, source: "tier-estimate" },
  "Gemini 3.1 Pro": { N_B: 1500, source: "tier-estimate" },
  "Grok 4": { N_B: 1500, source: "tier-estimate" },
};

/**
 * Default token counts per task class (Section 5.3). Used when the
 * row doesn't carry a measured token count.
 */
export const DEFAULT_TOKENS_PER_INFERENCE: Record<TaskClassKey, number> = {
  text_chat: 717,                       // ML.Energy mean for standard chat (Section 5.3)
  text_reasoning: 6988,                 // ML.Energy mean for reasoning (Section 5.3)
  text_agentic_moderate: 6000,
  text_agentic_test_time_scaled: 12000,
  image_standard_25step: 0,             // tokens irrelevant for image
  image_high_quality_50step: 0,
  video_short_5s: 0,
};
