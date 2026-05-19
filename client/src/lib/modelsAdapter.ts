/**
 * client/src/lib/modelsAdapter.ts
 *
 * Normalizes legacy AI_MODELS rows (from client/src/lib/data.ts) into the
 * Phase 1 canonical shape (DisplayModel) used by the new DataExplorer UI.
 *
 * Purpose: keep the dashboard rendering with provenance badges and
 * freshness dots even when the DB / Sanity isn't wired (dev mode without
 * DATABASE_URL / SANITY_PROJECT_ID). When Sanity returns real rows, those
 * are passed through with the same shape — only the legacy fallback path
 * uses this synthetic adapter.
 */

import { AI_MODELS, type AIModel as LegacyModel, type Category as LegacyCategory } from "./data";
import { inferConfidenceFromSource, type Classification, type Confidence } from "../../../shared/lib/provenance";

export type DisplayCategory = "text" | "image" | "video" | "code" | "audio" | "other";

export type EnergyUnit =
  | "wh_per_inference"
  | "wh_per_image"
  | "wh_per_video_second"
  | "wh_per_coding_task";

export interface DisplayModel {
  id: string;
  modelName: string;
  modelFamily: string;
  vendor: string;
  parameters: string | null;
  openWeight: boolean;

  category: DisplayCategory;
  taskClass: string;
  energyUnit: EnergyUnit;

  energyWh: number | null;
  energyWhMin: number | null;
  energyWhMax: number | null;
  carbonGCO2e: number | null;
  waterMl: number | null;

  classification: Classification;
  confidence: Confidence;
  sourceName: string;
  sourceUrl: string;
  measurementDate: string | null;
  lastVerifiedAt: string | null;

  hardware: string | null;
  softwareVersion: string | null;
  contextLength: number | null;
  batchSize: number | null;
  promptClass: string | null;
  trainingOrInference: "inference" | "training" | "both";

  compositeRank: number | null;
  inTop20: boolean;

  scaffold: string | null;
  sweVerified: number | null;
  swePro: number | null;

  status: "active" | "sunsetting" | "deprecated";
  statusNote: string | null;

  utilityScore: string | null;
  notes: string | null;

  // Convenience (used by sorting, search):
  energyForSort: number;
  // Original raw range string preserved for display:
  energyRangeRaw: string | null;

  // AICo2 audit fingerprint (Phase 3b). Null for legacy/adapted rows.
  tauApplied?: number | null;
  fApplied?: number | null;
  pueApplied?: number | null;
  gridIntensityGCO2ePerKWh?: number | null;
  wueLPerKWh?: number | null;
  facilityClass?: string | null;
  hardwareClass?: string | null;
  methodologyVersion?: string | null;
}

const SOURCE_LOOKUP: Record<string, { name: string; url: string; publishedAt: string }> = {
  "1": {
    name: "MIT Technology Review / ML.Energy",
    url: "https://www.technologyreview.com/2025/05/20/1116331/ai-energy-demand-methodology/",
    publishedAt: "2025-05-20",
  },
  "2": {
    name: "Google Cloud Infrastructure Blog",
    url: "https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference/",
    publishedAt: "2024-08-15",
  },
  "5": {
    name: "AI Energy Score (Hugging Face)",
    url: "https://huggingface.co/spaces/EnergyStarAI/2024_leaderboard",
    publishedAt: "2024-12-01",
  },
  "6": {
    name: "Artificial Analysis",
    url: "https://artificialanalysis.ai/",
    publishedAt: "2025-01-01",
  },
  "10": {
    name: "IEA / EPA / Academic Literature",
    url: "https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks",
    publishedAt: "2024-04-24",
  },
  "13": {
    name: "Stability AI / Diffusion Benchmarks",
    url: "https://stability.ai/",
    publishedAt: "2024-07-01",
  },
  "14": {
    name: "Stability AI / Diffusion Benchmarks",
    url: "https://stability.ai/",
    publishedAt: "2024-07-01",
  },
  "15": {
    name: "Hugging Face Open LLM Leaderboard",
    url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard",
    publishedAt: "2024-12-01",
  },
  "18": {
    name: "Ampere Computing / Agentic AI Research",
    url: "https://amperecomputing.com/blogs/agentic-ai",
    publishedAt: "2025-02-01",
  },
};

function firstSourceId(sourceText: string): string {
  const cleaned = sourceText.replace(/[^0-9,\s-]/g, "");
  const parts = cleaned.split(/[,\s-]+/).filter(Boolean);
  return parts[0] ?? "";
}

function mapSource(sourceText: string) {
  const id = firstSourceId(sourceText);
  return (
    SOURCE_LOOKUP[id] ?? {
      name: "Unknown / Mixed sources",
      url: "https://aipower.fyi/methodology",
      publishedAt: "2024-12-31",
    }
  );
}

function parseRange(raw: string | null | undefined): {
  min: number | null;
  max: number | null;
  point: number | null;
} {
  if (!raw || raw === "—") return { min: null, max: null, point: null };
  const cleaned = raw.replace(/[~,]/g, "").trim();
  const parts = cleaned
    .split(/\s*-\s*/)
    .map((s) => parseFloat(s))
    .filter((n) => !Number.isNaN(n));
  if (parts.length === 0) return { min: null, max: null, point: null };
  if (parts.length === 1) return { min: parts[0], max: parts[0], point: parts[0] };
  const min = Math.min(...parts);
  const max = Math.max(...parts);
  return { min, max, point: (min + max) / 2 };
}

function mapCategory(c: LegacyCategory): DisplayCategory {
  return c;
}

function deriveEnergyUnit(c: DisplayCategory): EnergyUnit {
  switch (c) {
    case "image":
      return "wh_per_image";
    case "video":
      return "wh_per_video_second";
    case "code":
      return "wh_per_coding_task";
    default:
      return "wh_per_inference";
  }
}

function deriveTaskClass(legacy: LegacyModel): string {
  const t = legacy.task.toLowerCase();
  if (t.includes("agentic")) return "agentic_workflow";
  if (t.includes("reasoning")) return "reasoning";
  if (t.includes("translation")) return "translation";
  if (t.includes("speech") || t.includes("audio") || t.includes("asr")) return "audio_asr";
  if (t.includes("detection")) return "detection";
  if (t.includes("classification")) return "classification";
  if (legacy.category === "image" && t.includes("generation")) return "image_diffusion";
  if (legacy.category === "image") return "classification";
  if (legacy.category === "video") return "video_generation";
  return "text_generation";
}

function vendorOf(modelLower: string): string {
  if (modelLower.includes("gpt") || modelLower.includes("o3-mini")) return "OpenAI";
  if (modelLower.includes("claude")) return "Anthropic";
  if (modelLower.includes("gemini")) return "Google";
  if (modelLower.includes("llama")) return "Meta";
  if (modelLower.includes("mixtral") || modelLower.includes("mistral")) return "Mistral";
  if (modelLower.includes("qwen")) return "Alibaba";
  if (modelLower.includes("deepseek")) return "DeepSeek";
  if (modelLower.includes("internlm") || modelLower.includes("internvl")) return "Shanghai AI Lab";
  if (modelLower.includes("stable diffusion") || modelLower.includes("sd")) return "Stability AI";
  if (modelLower.includes("cogvideo")) return "Zhipu AI";
  if (modelLower.includes("ltx")) return "Lightricks";
  if (modelLower.includes("whisper")) return "OpenAI";
  if (modelLower.includes("canary")) return "NVIDIA";
  if (modelLower.includes("t5")) return "Google";
  if (modelLower.includes("granite")) return "IBM";
  if (modelLower.includes("eva") || modelLower.includes("vit") || modelLower.includes("deta"))
    return "Open-source";
  if (modelLower.includes("bloom")) return "BigScience";
  return "Unknown";
}

function familyOf(modelLower: string, fallback: string): string {
  if (modelLower.includes("claude")) return "Claude";
  if (modelLower.includes("gpt")) return "GPT";
  if (modelLower.includes("llama")) return "Llama";
  if (modelLower.includes("mistral") || modelLower.includes("mixtral")) return "Mistral";
  if (modelLower.includes("gemini")) return "Gemini";
  if (modelLower.includes("qwen")) return "Qwen";
  if (modelLower.includes("deepseek")) return "DeepSeek";
  if (modelLower.includes("stable diffusion")) return "Stable Diffusion";
  if (modelLower.includes("cogvideo")) return "CogVideoX";
  return fallback;
}

/** Transform a legacy AIModel into the new DisplayModel shape with synthetic provenance. */
export function adaptLegacy(legacy: LegacyModel): DisplayModel {
  const cat = mapCategory(legacy.category);
  const energy = parseRange(legacy.energy);
  const carbon = parseRange(legacy.carbon);
  const water = parseRange(legacy.water);
  const src = mapSource(legacy.source);
  const lower = legacy.model.toLowerCase();

  return {
    id: `legacy-${legacy.id}`,
    modelName: legacy.model,
    modelFamily: familyOf(lower, legacy.model.split(/[\s/-]/)[0] || legacy.model),
    vendor: vendorOf(lower),
    parameters: legacy.size && legacy.size !== "N/A" ? legacy.size : null,
    openWeight: false,

    category: cat,
    taskClass: deriveTaskClass(legacy),
    energyUnit: deriveEnergyUnit(cat),

    energyWh: energy.point,
    energyWhMin: energy.min,
    energyWhMax: energy.max,
    carbonGCO2e: carbon.point,
    waterMl: water.point,

    classification: "estimated",
    confidence: inferConfidenceFromSource(src.name),
    sourceName: src.name,
    sourceUrl: src.url,
    measurementDate: `${src.publishedAt}T00:00:00Z`,
    lastVerifiedAt: `${src.publishedAt}T00:00:00Z`,

    hardware: null,
    softwareVersion: null,
    contextLength: null,
    batchSize: null,
    promptClass: null,
    trainingOrInference: "inference",

    compositeRank: null,
    inTop20: false,

    scaffold: null,
    sweVerified: null,
    swePro: null,

    status: "active",
    statusNote: null,

    utilityScore: legacy.utility,
    notes: `Original task: "${legacy.task}". Original source refs: "${legacy.source}".`,

    energyForSort: energy.max ?? 0,
    energyRangeRaw: legacy.energy && legacy.energy !== "—" ? legacy.energy : null,
  };
}

/** All 30 legacy rows transformed into the new shape. */
export const ADAPTED_MODELS: DisplayModel[] = AI_MODELS.map(adaptLegacy);

/** Display labels per category. */
export const CATEGORY_DISPLAY: Record<
  DisplayCategory,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  text: { label: "Text", color: "#818cf8", bgClass: "bg-indigo-500/15", textClass: "text-indigo-300" },
  image: { label: "Image", color: "#c4b5fd", bgClass: "bg-violet-500/15", textClass: "text-violet-300" },
  video: { label: "Video", color: "#fb7185", bgClass: "bg-rose-500/15", textClass: "text-rose-300" },
  code: { label: "Code", color: "#34d399", bgClass: "bg-emerald-500/15", textClass: "text-emerald-300" },
  audio: { label: "Audio", color: "#fcd34d", bgClass: "bg-amber-500/15", textClass: "text-amber-300" },
  other: { label: "Other", color: "#67e8f9", bgClass: "bg-cyan-500/15", textClass: "text-cyan-300" },
};

/** Per-category energy unit display. */
export const ENERGY_UNIT_LABEL: Record<EnergyUnit, { short: string; tooltip: string }> = {
  wh_per_inference: {
    short: "Wh / inference",
    tooltip: "Watt-hours per single inference (one prompt or query).",
  },
  wh_per_image: {
    short: "Wh / image",
    tooltip:
      "Watt-hours per generated image. Standardized to 1024×1024 at 30 diffusion steps where applicable.",
  },
  wh_per_video_second: {
    short: "Wh / video sec",
    tooltip:
      "Watt-hours per second of generated video. Normalized to 720p output where the source allows.",
  },
  wh_per_coding_task: {
    short: "Wh / SWE-bench task",
    tooltip:
      "Watt-hours per end-to-end SWE-bench Verified task. Most rows are derived from token-count × text-model energy because no lab publishes this number directly.",
  },
};
