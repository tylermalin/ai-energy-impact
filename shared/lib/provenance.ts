/**
 * Provenance helpers shared between the server-side ingestion code
 * and the client-side display logic.
 *
 * Confidence derivation rule (Phase 1):
 *   - Hugging Face / ML.Energy / Google Cloud sources -> "medium"
 *   - Artificial Analysis sources                     -> "medium-low"
 *   - FAS / IEA / EPA / academic policy sources       -> "low"
 *   - Anything else -> "low" (conservative default)
 */

export type Classification = "measured" | "derived" | "estimated";
export type Confidence = "high" | "medium" | "medium-low" | "low";

/**
 * Map a free-text source reference (matches what we have today in
 * `client/src/lib/data.ts:source`) to a confidence level.
 */
export function inferConfidenceFromSource(sourceText: string): Confidence {
  const s = sourceText.toLowerCase();
  if (
    s.includes("hugging face") ||
    s.includes("huggingface") ||
    s.includes("ml.energy") ||
    s.includes("google cloud")
  ) {
    return "medium";
  }
  if (s.includes("artificial analysis") || s.includes("artificialanalysis")) {
    return "medium-low";
  }
  if (
    s.includes("fas") ||
    s.includes("federation of american scientists") ||
    s.includes("iea") ||
    s.includes("epa") ||
    s.includes("carnegie mellon")
  ) {
    return "low";
  }
  return "low";
}

/**
 * Display metadata for the classification badge.
 */
export const CLASSIFICATION_DISPLAY: Record<
  Classification,
  { label: string; bgClass: string; textClass: string; tooltip: string }
> = {
  measured: {
    label: "Measured",
    bgClass: "bg-emerald-500/15 border-emerald-400/30",
    textClass: "text-emerald-300",
    tooltip:
      "Direct hardware-level measurement on disclosed hardware/software conditions.",
  },
  derived: {
    label: "Derived",
    bgClass: "bg-amber-500/15 border-amber-400/30",
    textClass: "text-amber-300",
    tooltip:
      "Computed from related measured data (pricing, throughput, related model energy) using documented assumptions.",
  },
  estimated: {
    label: "Estimated",
    bgClass: "bg-white/10 border-white/15",
    textClass: "text-white/70",
    tooltip:
      "Inferred from indirect signals or expert judgement. Confidence varies — check the per-row confidence level.",
  },
};

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  "medium-low": "Medium-Low",
  low: "Low",
};
