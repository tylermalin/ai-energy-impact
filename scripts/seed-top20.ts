/**
 * scripts/seed-top20.ts
 *
 * Reads data/seed-top20.yaml and merges the four Top-20 lists into
 * model_energy_records. Behaviour per the Phase 1 plan:
 *
 *   - Existing row matched on normalized modelName: enrich with vendor,
 *     openWeight, compositeRank, inTop20=true, scaffold/status if applicable.
 *     Energy / measurement values are preserved.
 *
 *   - No match: create a new row with energy fields = null, inTop20=true,
 *     compositeRank from seed, classification = "estimated",
 *     confidence = "low", lastVerifiedAt = null (so the freshness dot
 *     reads as "unverified" until an adapter populates it).
 *
 * Run with:
 *   DATABASE_URL=mysql://... pnpm tsx scripts/seed-top20.ts
 *
 * Idempotent: safe to re-run.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { drizzle } from "drizzle-orm/mysql2";
import { and, eq, sql } from "drizzle-orm";
import { parse as parseYaml } from "yaml";
import {
  modelEnergyRecords,
  type InsertModelEnergyRecord,
} from "../drizzle/schema";

if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line no-console
  console.error("DATABASE_URL is required to run the seed-top20 script.");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

type SeedCategory = "text" | "image" | "video" | "code";

interface SeedRow {
  rank: number;
  modelName: string;
  vendor: string;
  openWeight: boolean;
  scaffold?: string;
  sweVerified?: number | null;
  swePro?: number | null;
  status?: string;
  /** Optional override; defaults derive from category (see deriveTaskClass). */
  taskClass?: InsertModelEnergyRecord["taskClass"];
}

interface SeedFile {
  text: SeedRow[];
  image: SeedRow[];
  video: SeedRow[];
  code: SeedRow[];
}

/** Loose name-match: lowercase, trim, collapse whitespace, drop punctuation. */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s\-_/().,]+/g, " ")
    .trim();
}

function deriveEnergyUnit(category: SeedCategory): InsertModelEnergyRecord["energyUnit"] {
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

function deriveTaskClass(category: SeedCategory): InsertModelEnergyRecord["taskClass"] {
  switch (category) {
    case "image":
      return "image_diffusion";
    case "video":
      return "video_generation";
    case "code":
      return "code_swe_task";
    default:
      return "text_generation";
  }
}

function deriveStandardizedConditions(category: SeedCategory): Record<string, unknown> | undefined {
  switch (category) {
    case "image":
      return { resolution: "1024x1024", steps: 30 };
    case "video":
      return { resolution: "720p", duration_seconds: 5 };
    case "code":
      return { benchmark: "swe-bench", suite: "verified" };
    default:
      return undefined;
  }
}

function fingerprint(
  modelName: string,
  category: string,
  sourceName: string,
  dateIso: string,
): string {
  // Category is included so the same modelName can appear in multiple
  // categories (e.g. "Claude Opus 4.7" is both #2 text and #1 code) without
  // colliding on the sourceFingerprint unique index.
  const h = createHash("sha256");
  h.update(`${modelName}::${category}::${sourceName}::${dateIso}`);
  return h.digest("hex").slice(0, 32);
}

function modelFamilyOf(modelName: string): string {
  const lower = modelName.toLowerCase();
  if (lower.includes("claude")) return "Claude";
  if (lower.startsWith("gpt") || lower.startsWith("dall")) return "GPT";
  if (lower.includes("llama")) return "Llama";
  if (lower.includes("gemini")) return "Gemini";
  if (lower.includes("qwen")) return "Qwen";
  if (lower.includes("deepseek")) return "DeepSeek";
  if (lower.includes("mistral") || lower.includes("mixtral")) return "Mistral";
  if (lower.includes("flux")) return "Flux";
  if (lower.includes("stable diffusion")) return "Stable Diffusion";
  if (lower.includes("kling")) return "Kling";
  if (lower.includes("midjourney")) return "Midjourney";
  if (lower.includes("imagen")) return "Imagen";
  if (lower.includes("veo")) return "Veo";
  if (lower.includes("sora")) return "Sora";
  if (lower.includes("kimi")) return "Kimi";
  if (lower.includes("glm")) return "GLM";
  if (lower.includes("minimax")) return "MiniMax";
  if (lower.includes("grok") || lower.includes("aurora")) return "Grok";
  return modelName.split(/\s+/)[0] ?? modelName;
}

async function main() {
  const yamlPath = resolve(process.cwd(), "data/seed-top20.yaml");
  // eslint-disable-next-line no-console
  console.log(`[seed-top20] Reading ${yamlPath}`);
  const raw = readFileSync(yamlPath, "utf8");
  const seed = parseYaml(raw) as SeedFile;

  let merged = 0;
  let created = 0;

  for (const category of ["text", "image", "video", "code"] as const) {
    const rows = seed[category] ?? [];
    // eslint-disable-next-line no-console
    console.log(`[seed-top20] Processing ${rows.length} ${category} rows`);

    for (const seedRow of rows) {
      const targetNorm = normalizeName(seedRow.modelName);

      // Look for an existing row whose normalized name matches.
      // We pull all rows in this category and filter in-process (the seed is
      // small and the table will be small at v1; an index scan is fine).
      const existing = await db
        .select()
        .from(modelEnergyRecords)
        .where(eq(modelEnergyRecords.category, category));

      const match = existing.find((r) => normalizeName(r.modelName) === targetNorm);

      const sourceName = "BenchLM (May 2026 seed)";
      const sourceUrl = "https://benchlm.com/";
      const measurementDate = new Date("2026-05-01T00:00:00Z");
      const fp = fingerprint(seedRow.modelName, category, sourceName, measurementDate.toISOString());

      if (match) {
        // Enrich: set rank/vendor/openWeight/inTop20/scaffold/status. Preserve energy.
        await db
          .update(modelEnergyRecords)
          .set({
            vendor: seedRow.vendor,
            openWeight: seedRow.openWeight,
            compositeRank: seedRow.rank,
            inTop20: true,
            scaffold: seedRow.scaffold ?? match.scaffold ?? undefined,
            sweVerified: seedRow.sweVerified ?? match.sweVerified ?? undefined,
            swePro: seedRow.swePro ?? match.swePro ?? undefined,
            status:
              seedRow.status === "sunsetting-2026-09-24"
                ? "sunsetting"
                : (match.status ?? "active"),
            statusNote: seedRow.status === "sunsetting-2026-09-24" ? "sunsetting 2026-09-24" : match.statusNote,
          })
          .where(and(eq(modelEnergyRecords.id, match.id)));
        merged++;
      } else {
        const row: InsertModelEnergyRecord = {
          modelName: seedRow.modelName,
          modelFamily: modelFamilyOf(seedRow.modelName),
          modelVersion: undefined,
          vendor: seedRow.vendor,
          parameters: undefined,
          openWeight: seedRow.openWeight,

          category,
          taskClass: seedRow.taskClass ?? deriveTaskClass(category),
          energyUnit: deriveEnergyUnit(category),

          energyWh: undefined,
          energyWhMin: undefined,
          energyWhMax: undefined,
          carbonGCO2e: undefined,
          waterMl: undefined,

          classification: "estimated",
          confidence: "low",
          sourceName,
          sourceUrl,
          sourceCitation: undefined,
          measurementDate,
          lastVerifiedAt: new Date(0), // sentinel: ingested but not measured (renders as "unverified" in UI)

          hardware: undefined,
          softwareVersion: undefined,
          contextLength: undefined,
          batchSize: undefined,
          promptClass: undefined,
          trainingOrInference: "inference",
          standardizedConditions: deriveStandardizedConditions(category),

          compositeRank: seedRow.rank,
          inTop20: true,

          scaffold: seedRow.scaffold,
          sweVerified: seedRow.sweVerified ?? undefined,
          swePro: seedRow.swePro ?? undefined,

          status:
            seedRow.status === "sunsetting-2026-09-24" ? "sunsetting" : "active",
          statusNote:
            seedRow.status === "sunsetting-2026-09-24" ? "sunsetting 2026-09-24" : undefined,

          utilityScore: undefined,
          notes: `Seeded from data/seed-top20.yaml on ${new Date().toISOString().slice(0, 10)}. Energy values to be populated by ingestion adapters.`,

          sourceFingerprint: fp,
          promotedAt: undefined,
          sanityDocId: undefined,
        };

        try {
          await db
            .insert(modelEnergyRecords)
            .values(row)
            .onDuplicateKeyUpdate({
              set: { compositeRank: seedRow.rank, inTop20: true, lastVerifiedAt: sql`lastVerifiedAt` },
            });
          created++;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[seed-top20] Failed to insert ${seedRow.modelName}:`, err);
        }
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[seed-top20] Done. merged=${merged} created=${created}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[seed-top20] Unhandled error:", err);
  process.exit(1);
});
