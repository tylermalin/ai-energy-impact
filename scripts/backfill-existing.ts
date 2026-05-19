/**
 * scripts/backfill-existing.ts
 *
 * One-time backfill script: takes the existing 30 hardcoded rows from
 * client/src/lib/data.ts and inserts them into the model_energy_records
 * MySQL table with the Phase 1 provenance fields populated per the
 * defaults documented in the Phase 1 plan.
 *
 * Run with:
 *   DATABASE_URL=mysql://... pnpm tsx scripts/backfill-existing.ts
 *
 * Idempotent: dedupes via sourceFingerprint. Re-running updates lastVerifiedAt
 * but does not touch energy/measurement values for already-loaded rows.
 *
 * Defaults applied (per Phase 1 spec):
 *   - classification        = "estimated"
 *   - trainingOrInference   = "inference"
 *   - confidence            = inferred from sourceText (see provenance.ts)
 *   - measurementDate       = source publication date (best effort) | 2024-12-31
 *   - lastVerifiedAt        = now
 *   - inTop20               = false
 *   - energyUnit            = derived from category (text/code -> wh_per_inference,
 *                             image -> wh_per_image, video -> wh_per_video_second)
 */

import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import {
  modelEnergyRecords,
  type InsertModelEnergyRecord,
} from "../drizzle/schema";
import { AI_MODELS, type AIModel, type Category as LegacyCategory } from "../client/src/lib/data";
import { inferConfidenceFromSource } from "../shared/lib/provenance";

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error("DATABASE_URL is required to run the backfill script.");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);
const DEFAULT_MEASUREMENT_DATE = new Date("2024-12-31T00:00:00Z");

/**
 * Map opaque source-id strings ("1, 5-9", "10, 13") to (sourceName, sourceUrl).
 * Mirror of the SOURCES table in client/src/components/MethodologySection.tsx,
 * collapsed to the primary attribution we want stored on each row.
 *
 * The string is the "first ID range" in the original `source` field; rows
 * with multiple sources get the *first* matched source as their primary
 * attribution, and the full original string is preserved in `notes`.
 */
const SOURCE_LOOKUP: Record<
  string,
  { name: string; url: string; publishedAt: string }
> = {
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

/** Pull the first numeric ID out of a "1-4" / "5, 7" / "1, 5-9" string. */
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
      publishedAt: DEFAULT_MEASUREMENT_DATE.toISOString().slice(0, 10),
    }
  );
}

/** Parse "0.3 - 2.9" or "~1,000.0" or "—" into { min, max, midpoint }. */
function parseEnergyRange(raw: string | undefined | null): {
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
  if (parts.length === 1) {
    return { min: parts[0], max: parts[0], point: parts[0] };
  }
  const min = Math.min(...parts);
  const max = Math.max(...parts);
  return { min, max, point: (min + max) / 2 };
}

type NewCategory = "text" | "image" | "video" | "code" | "audio" | "other";
function mapCategory(c: LegacyCategory): NewCategory {
  // Existing data has no "code" rows; categories map 1:1.
  return c;
}

type EnergyUnit =
  | "wh_per_inference"
  | "wh_per_image"
  | "wh_per_video_second"
  | "wh_per_coding_task";
function deriveEnergyUnit(category: NewCategory): EnergyUnit {
  switch (category) {
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

type TaskClass =
  | "text_generation"
  | "reasoning"
  | "image_diffusion"
  | "video_generation"
  | "audio_asr"
  | "classification"
  | "detection"
  | "translation"
  | "agentic_workflow"
  | "code_swe_task";

function deriveTaskClass(legacy: AIModel): TaskClass {
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

/**
 * Best-effort split of a model string into (family, version, parameters).
 * Heuristic only — refined later as rows are reviewed in Sanity Studio.
 */
function splitModelIdentity(legacy: AIModel): {
  modelFamily: string;
  modelVersion: string | null;
  parameters: string | null;
  vendor: string;
} {
  const m = legacy.model;
  const lower = m.toLowerCase();
  const params = legacy.size && legacy.size !== "N/A" ? legacy.size : null;

  let family = m.split(/[\s/-]/)[0] || m;
  let vendor = "Unknown";
  if (lower.includes("gpt") || lower.includes("o3-mini")) vendor = "OpenAI";
  else if (lower.includes("claude")) vendor = "Anthropic";
  else if (lower.includes("gemini")) vendor = "Google";
  else if (lower.includes("llama") || lower.includes("mixtral")) vendor = lower.includes("llama") ? "Meta" : "Mistral";
  else if (lower.includes("mistral")) vendor = "Mistral";
  else if (lower.includes("qwen")) vendor = "Alibaba";
  else if (lower.includes("deepseek")) vendor = "DeepSeek";
  else if (lower.includes("internlm") || lower.includes("internvl")) vendor = "Shanghai AI Lab";
  else if (lower.includes("stable diffusion") || lower.includes("sd")) vendor = "Stability AI";
  else if (lower.includes("cogvideo")) vendor = "Zhipu AI";
  else if (lower.includes("ltx")) vendor = "Lightricks";
  else if (lower.includes("whisper")) vendor = "OpenAI";
  else if (lower.includes("canary")) vendor = "NVIDIA";
  else if (lower.includes("t5")) vendor = "Google";
  else if (lower.includes("granite")) vendor = "IBM";
  else if (lower.includes("eva") || lower.includes("vit") || lower.includes("deta")) vendor = "Open-source";
  else if (lower.includes("bloom")) vendor = "BigScience";

  // Family heuristic
  if (lower.includes("claude")) family = "Claude";
  else if (lower.includes("gpt")) family = "GPT";
  else if (lower.includes("llama")) family = "Llama";
  else if (lower.includes("mistral") || lower.includes("mixtral")) family = "Mistral";
  else if (lower.includes("gemini")) family = "Gemini";
  else if (lower.includes("qwen")) family = "Qwen";
  else if (lower.includes("deepseek")) family = "DeepSeek";
  else if (lower.includes("stable diffusion")) family = "Stable Diffusion";
  else if (lower.includes("cogvideo")) family = "CogVideoX";

  return { modelFamily: family, modelVersion: null, parameters: params, vendor };
}

function fingerprint(modelName: string, sourceName: string, measurementDate: Date): string {
  const h = createHash("sha256");
  h.update(`${modelName}::${sourceName}::${measurementDate.toISOString()}`);
  return h.digest("hex").slice(0, 32);
}

async function main() {
  // eslint-disable-next-line no-console
  console.log(`[backfill] Starting backfill of ${AI_MODELS.length} legacy rows...`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const legacy of AI_MODELS) {
    const newCategory = mapCategory(legacy.category);
    const energyUnit = deriveEnergyUnit(newCategory);
    const taskClass = deriveTaskClass(legacy);
    const { modelFamily, modelVersion, parameters, vendor } = splitModelIdentity(legacy);

    const energy = parseEnergyRange(legacy.energy);
    const carbon = parseEnergyRange(legacy.carbon);
    const water = parseEnergyRange(legacy.water);

    const src = mapSource(legacy.source);
    const measurementDate = new Date(`${src.publishedAt}T00:00:00Z`);
    const confidence = inferConfidenceFromSource(src.name);
    const fp = fingerprint(legacy.model, src.name, measurementDate);

    const row: InsertModelEnergyRecord = {
      modelName: legacy.model,
      modelFamily,
      modelVersion: modelVersion ?? undefined,
      vendor,
      parameters: parameters ?? undefined,
      openWeight: false,

      category: newCategory,
      taskClass,
      energyUnit,

      energyWh: energy.point ?? undefined,
      energyWhMin: energy.min ?? undefined,
      energyWhMax: energy.max ?? undefined,
      carbonGCO2e: carbon.point ?? undefined,
      waterMl: water.point ?? undefined,

      classification: "estimated",
      confidence,
      sourceName: src.name,
      sourceUrl: src.url,
      sourceCitation: undefined,
      measurementDate,
      lastVerifiedAt: new Date(),

      hardware: undefined,
      softwareVersion: undefined,
      contextLength: undefined,
      batchSize: undefined,
      promptClass: undefined,
      trainingOrInference: "inference",
      standardizedConditions: undefined,

      compositeRank: undefined,
      inTop20: false,

      scaffold: undefined,
      sweVerified: undefined,
      swePro: undefined,

      status: "active",
      statusNote: undefined,

      utilityScore: legacy.utility,
      notes: `Original task label: "${legacy.task}". Original source refs: "${legacy.source}". Original energy string: "${legacy.energy}". Backfilled ${new Date().toISOString().slice(0, 10)}.`,

      sourceFingerprint: fp,
      promotedAt: undefined,
      sanityDocId: undefined,
    };

    try {
      const res = await db
        .insert(modelEnergyRecords)
        .values(row)
        .onDuplicateKeyUpdate({
          set: { lastVerifiedAt: sql`NOW()` },
        });
      // mysql2's affectedRows: 1 = inserted, 2 = updated via duplicate key.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const affected = (res as any)?.[0]?.affectedRows ?? 0;
      if (affected === 1) inserted++;
      else if (affected === 2) updated++;
      else skipped++;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[backfill] Failed to insert ${legacy.model}:`, err);
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `[backfill] Done. inserted=${inserted} updated=${updated} skipped=${skipped} total=${AI_MODELS.length}`,
  );

  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[backfill] Unhandled error:", err);
  process.exit(1);
});
