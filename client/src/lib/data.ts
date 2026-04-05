export type Category = "text" | "image" | "video" | "audio" | "other";

/** Mālama AICo2 Methodology — the full framework document */
export const AICO2_METHODOLOGY_URL = "https://www.dropbox.com/scl/fi/uc73r17p40un79ptj6266/M-lama-AICo2-Methodology.pdf?rlkey=kmn42xf9rocbckefxglepdjxr&st=24jvib86&dl=0";

export interface AIModel {
  id: number;
  task: string;
  model: string;
  size: string;
  energy: string;
  energyMax: number;
  carbon: string;
  carbonMax: number;
  water: string;
  waterMax: number;
  utility: string;
  source: string;
  category: Category;
}

function parseMax(str: string): number {
  if (!str || str === "—") return 0;
  const parts = str
    .replace(/[~,]/g, "")
    .split("-")
    .map((s) => parseFloat(s.trim()));
  return Math.max(...parts.filter((n) => !isNaN(n)));
}

const rawData = [
  { task: "Video Generation - Comprehensive", model: "CogVideoX (5s Clip)", size: "N/A", energy: "30.27 - 944.44", carbon: "~380.0", water: "~1,000.0", utility: "SOTA photorealistic video / baseline FVD", source: "1-4", category: "video" as Category },
  { task: "Text: Complex Reasoning", model: "o3-mini / DeepSeek-R1", size: "671B (R1)", energy: "1.9 - 33.6", carbon: "0.76 - 2.80", water: "7.0 - 40.0", utility: "SOTA math reasoning / AIME / Math Olympiad", source: "1, 5-9", category: "text" as Category },
  { task: "Text Generation", model: "Gemini (Median)", size: "N/A", energy: "0.24", carbon: "0.03", water: "0.26", utility: "1360 Arena Score / General SOTA", source: "2, 10-12", category: "text" as Category },
  { task: "Text Generation (ChatGPT)", model: "GPT-4o", size: "100B-200B", energy: "0.3 - 2.9", carbon: "0.02", water: "0.3", utility: "1400 Arena Score / SOTA reasoning", source: "10, 13", category: "text" as Category },
  { task: "Text (Frontier)", model: "Llama 3.1 405B", size: "405B", energy: "0.43 - 1.86", carbon: "—", water: "—", utility: "MMLU: 88.6 / Frontier open model", source: "1-3, 7, 9", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "GPT-o3", size: "N/A", energy: "39.2", carbon: "—", water: "—", utility: "Advanced reasoning capabilities", source: "6", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "GPT-4.5", size: "N/A", energy: "30.5", carbon: "—", water: "—", utility: "SOTA multi-modal performance", source: "6", category: "text" as Category },
  { task: "Image: Standard Diffusion", model: "Stable Diffusion 3 / Medium", size: "2B-8B", energy: "0.317 - 1.22", carbon: "0.24 - 0.48", water: "~2.0", utility: "High aesthetic / Text-to-image fidelity", source: "1, 2, 5, 14", category: "image" as Category },
  { task: "Text Generation (Inference)", model: "Qwen2-72B-Instruct", size: "73B", energy: "9.86 - 9.87", carbon: "3.93", water: "—", utility: "0.6 Avg Score (HuggingFace)", source: "15-17", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "Llama 3.1 70B / DeepSeek R1", size: "70B", energy: "0.86 - 33.6", carbon: "2.042", water: "—", utility: "1350 Arena Score / Efficient mid-size", source: "5, 7", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "BLOOM", size: "176B", energy: "4", carbon: "1.5", water: "—", utility: "1100 Arena Score baseline", source: "10", category: "text" as Category },
  { task: "Agentic Workflows", model: "Agentic AI (GPT-4 class)", size: "Large", energy: "4.32", carbon: "—", water: "—", utility: "Complex multi-step reasoning", source: "18", category: "text" as Category },
  { task: "Text (Realistic Production)", model: "Frontier Models (GPT-4 class)", size: "Large", energy: "0.34 - 4.32", carbon: "—", water: "—", utility: "SOTA reasoning / High utility", source: "7, 18-20", category: "text" as Category },
  { task: "Text (Conversational)", model: "LLaMA", size: "65B", energy: "0.3", carbon: "—", water: "—", utility: "1150 Arena Score", source: "10", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "InternLM2.5-7B-Chat", size: "8B", energy: "2.23", carbon: "0.89", water: "—", utility: "0.6 Avg Score (HuggingFace)", source: "15-17", category: "text" as Category },
  { task: "Text (Basic/Simple)", model: "Llama 3.1 8B", size: "8B", energy: "0.016 - 0.24", carbon: "0.01 - 0.10", water: "0.26", utility: "MMLU: 68.4 / Efficiency trade-off", source: "1-4", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "Mixtral 8x22B", size: "141B (MoE)", energy: "0.07", carbon: "—", water: "—", utility: "Efficient MoE architecture", source: "7", category: "text" as Category },
  { task: "Text Generation", model: "Mistral Large 2", size: "N/A", energy: "—", carbon: "1.14", water: "45", utility: "1250 Arena Score", source: "10", category: "text" as Category },
  { task: "Text Generation (Inference)", model: "GPT-4.1 Nano / 4.1 Long", size: "N/A", energy: "0.45 - 4.83", carbon: "—", water: "—", utility: "Small is Sufficient / SOTA efficiency", source: "6, 8", category: "text" as Category },
  { task: "Image-Text to Text", model: "InternVL2-8B", size: "8B", energy: "0.02", carbon: "0.01", water: "—", utility: "51.2 MMMU Score", source: "15, 16", category: "image" as Category },
  { task: "Image Classification", model: "EVA02 Large", size: "305M", energy: "1.53", carbon: "0.61", water: "—", utility: "90% ImageNet Accuracy", source: "15, 16", category: "image" as Category },
  { task: "Image Classification", model: "TinyViT-21M", size: "21M", energy: "0.53", carbon: "0.21", water: "—", utility: "90% ImageNet Accuracy", source: "15-17", category: "image" as Category },
  { task: "Object Detection", model: "DETA-Swin-Large", size: "219M", energy: "2.40", carbon: "0.96", water: "—", utility: "0.6 Average Precision", source: "15, 16", category: "image" as Category },
  { task: "Object Detection", model: "DETA-ResNet-50", size: "49M", energy: "1.20", carbon: "0.48", water: "—", utility: "0.5 Average Precision", source: "15, 16", category: "image" as Category },
  { task: "Speech Recognition", model: "NVIDIA Canary-1B", size: "1B", energy: "1.04", carbon: "0.41", water: "—", utility: "33.3 WER", source: "15, 16", category: "audio" as Category },
  { task: "Speech Recognition", model: "Whisper Base (EN)", size: "73M", energy: "0.20", carbon: "0.08", water: "—", utility: "29.5 WER", source: "15, 16", category: "audio" as Category },
  { task: "Translation", model: "Google T5-Large", size: "738M", energy: "0.03", carbon: "0.01", water: "—", utility: "32.0 BLEU Score", source: "15, 16", category: "other" as Category },
  { task: "Time Series Forecasting", model: "Granite-TimeSeries-PatchTST", size: "616K", energy: "0.11", carbon: "0.04", water: "—", utility: "0.6 MSE/Utility", source: "15, 16", category: "other" as Category },
  { task: "Text Classification", model: "Fine-tuned (Task-Specific)", size: "Small", energy: "0.06 - 0.1", carbon: "—", water: "—", utility: "High accuracy (narrow task)", source: "2", category: "other" as Category },
  { task: "Video Generation (Real-time)", model: "LTX-Video", size: "N/A", energy: "0.0005", carbon: "—", water: "—", utility: "High efficiency / 30fps HD", source: "4", category: "video" as Category },
];

export const AI_MODELS: AIModel[] = rawData.map((d, i) => ({
  id: i + 1,
  ...d,
  energyMax: parseMax(d.energy),
  carbonMax: parseMax(d.carbon),
  waterMax: parseMax(d.water),
}));

export const MAX_ENERGY = Math.max(...AI_MODELS.map((m) => m.energyMax));

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  text: { label: "Text", color: "#818cf8", bgClass: "bg-indigo-500/15", textClass: "text-indigo-300" },
  image: { label: "Image", color: "#c4b5fd", bgClass: "bg-violet-500/15", textClass: "text-violet-300" },
  video: { label: "Video", color: "#fb7185", bgClass: "bg-rose-500/15", textClass: "text-rose-300" },
  audio: { label: "Audio", color: "#fcd34d", bgClass: "bg-amber-500/15", textClass: "text-amber-300" },
  other: { label: "Other", color: "#67e8f9", bgClass: "bg-cyan-500/15", textClass: "text-cyan-300" },
};

export function getEnergyLevel(val: number): "low" | "med" | "high" | "extreme" {
  if (val <= 0.5) return "low";
  if (val <= 5) return "med";
  if (val <= 40) return "high";
  return "extreme";
}

export const ENERGY_COLORS = {
  low: { bar: "from-emerald-400 to-emerald-300", text: "text-emerald-400" },
  med: { bar: "from-amber-400 to-amber-300", text: "text-amber-400" },
  high: { bar: "from-rose-500 to-rose-400", text: "text-rose-400" },
  extreme: { bar: "from-red-600 to-red-500", text: "text-red-500" },
};

// Summary stats
export const STATS = {
  totalModels: AI_MODELS.length,
  highestEnergy: { value: "944.44 Wh", model: "CogVideoX (Video Gen)" },
  lowestEnergy: { value: "0.0005 Wh", model: "LTX-Video (Real-time)" },
  maxCarbon: { value: "~380 gCO\u2082e", model: "CogVideoX (Video Gen)" },
  maxWater: { value: "~1,000 mL", model: "CogVideoX (Video Gen)" },
  categoryCounts: {
    text: AI_MODELS.filter((m) => m.category === "text").length,
    image: AI_MODELS.filter((m) => m.category === "image").length,
    video: AI_MODELS.filter((m) => m.category === "video").length,
    audio: AI_MODELS.filter((m) => m.category === "audio").length,
    other: AI_MODELS.filter((m) => m.category === "other").length,
  },
};

// Chart data for energy by category
export const ENERGY_BY_CATEGORY = Object.entries(STATS.categoryCounts).map(([cat, count]) => {
  const models = AI_MODELS.filter((m) => m.category === cat);
  const avgEnergy = models.reduce((sum, m) => sum + m.energyMax, 0) / (models.length || 1);
  const maxEnergy = Math.max(...models.map((m) => m.energyMax));
  return {
    category: CATEGORY_CONFIG[cat as Category].label,
    count,
    avgEnergy: Math.round(avgEnergy * 100) / 100,
    maxEnergy: Math.round(maxEnergy * 100) / 100,
    color: CATEGORY_CONFIG[cat as Category].color,
  };
});
