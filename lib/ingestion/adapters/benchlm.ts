/**
 * adapters/benchlm.ts
 *
 * Primary capability + ranking source. Covers all 4 categories
 * (text, image, video, code). Emits compositeRank + identity fields
 * (vendor, openWeight, scaffold, etc). Does NOT emit energy/carbon/water
 * — those come from the energy adapters.
 *
 * Live HTTP: BenchLM publishes leaderboards on benchlm.com. Today this
 * adapter ships with mock data shaped like a hypothetical BenchLM JSON
 * payload (see fixtures/benchlm.json). Setting USE_LIVE_HTTP=1 would
 * trigger the live fetch (commented placeholder below — real fetch
 * pending API access / scraping discussion with BenchLM).
 *
 * sourceName = "BenchLM"
 * measurementDate = first day of current month (snapshot semantics)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { firstOfMonth, makeFingerprint } from "../fingerprint";
import type { Adapter, NormalizedRecord } from "../types";

interface BenchLMRow {
  category: "text" | "image" | "video" | "code";
  rank: number;
  modelName: string;
  vendor: string;
  openWeight: boolean;
  scaffold?: string | null;
  sweVerified?: number | null;
  swePro?: number | null;
  status?: "active" | "sunsetting" | "deprecated";
  statusNote?: string | null;
}

const SOURCE_NAME = "BenchLM";
const SOURCE_URL = "https://benchlm.com/";

function deriveTaskClass(cat: BenchLMRow["category"]): NormalizedRecord["taskClass"] {
  switch (cat) {
    case "image": return "image_diffusion";
    case "video": return "video_generation";
    case "code":  return "code_swe_task";
    default:      return "text_generation";
  }
}

function deriveEnergyUnit(cat: BenchLMRow["category"]): NormalizedRecord["energyUnit"] {
  switch (cat) {
    case "image": return "wh_per_image";
    case "video": return "wh_per_video_second";
    case "code":  return "wh_per_coding_task";
    default:      return "wh_per_inference";
  }
}

function modelFamilyOf(name: string): string {
  const l = name.toLowerCase();
  if (l.includes("claude")) return "Claude";
  if (l.includes("gpt") || l.includes("dall")) return "GPT";
  if (l.includes("gemini")) return "Gemini";
  if (l.includes("llama")) return "Llama";
  if (l.includes("qwen")) return "Qwen";
  if (l.includes("deepseek")) return "DeepSeek";
  if (l.includes("mistral") || l.includes("mixtral")) return "Mistral";
  if (l.includes("kimi")) return "Kimi";
  if (l.includes("glm")) return "GLM";
  if (l.includes("midjourney")) return "Midjourney";
  if (l.includes("flux")) return "Flux";
  if (l.includes("imagen")) return "Imagen";
  if (l.includes("veo")) return "Veo";
  if (l.includes("sora")) return "Sora";
  if (l.includes("stable diffusion")) return "Stable Diffusion";
  return name.split(/\s+/)[0] ?? name;
}

async function fetchLive(): Promise<BenchLMRow[]> {
  // PLACEHOLDER. Real implementation would either:
  //   1. Call a BenchLM public API endpoint (none confirmed yet), or
  //   2. Scrape the leaderboard HTML with cheerio.
  // Both pending Tyler's outreach to the BenchLM maintainers re: attribution
  // and terms (see Phase 1 plan notes).
  //
  // Example sketch using fetch + cheerio (NOT executed):
  //   const res = await fetch("https://benchlm.com/leaderboards/text");
  //   const html = await res.text();
  //   const $ = cheerio.load(html);
  //   ...parse and return rows
  throw new Error("benchlm: live HTTP not yet implemented (set USE_LIVE_HTTP=0 to use mock fixture)");
}

function fetchMock(): BenchLMRow[] {
  const fixturePath = resolve(process.cwd(), "lib/ingestion/fixtures/benchlm.json");
  const raw = readFileSync(fixturePath, "utf8");
  return JSON.parse(raw) as BenchLMRow[];
}

export const benchlmAdapter: Adapter = {
  name: "benchlm",
  coverage: ["text", "image", "video", "code"],
  description:
    "Primary capability + ranking source. Emits compositeRank, vendor, openWeight, scaffold, SWE-bench scores. No energy data.",

  async fetchAndNormalize(): Promise<NormalizedRecord[]> {
    const useLive = process.env.USE_LIVE_HTTP === "1";
    const rows = useLive ? await fetchLive() : fetchMock();
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
        modelFamily: modelFamilyOf(r.modelName),
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: r.openWeight,

        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),

        // BenchLM is capability-only. Energy values are null here; the
        // energy adapters fill them in via separate rows.
        energyWh: null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,

        classification: "estimated",
        confidence: "low",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: new Date(),

        hardware: null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions: null,

        compositeRank: r.rank,
        inTop20: r.rank <= 20,

        scaffold: r.scaffold ?? null,
        sweVerified: r.sweVerified ?? null,
        swePro: r.swePro ?? null,

        status: r.status ?? "active",
        statusNote: r.statusNote ?? null,

        utilityScore: null,
        notes: `Ingested from BenchLM on ${new Date().toISOString().slice(0, 10)}.`,

        sourceFingerprint: fp,
      };
    });
  },
};
