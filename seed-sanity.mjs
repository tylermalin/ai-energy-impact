/**
 * Sanity CMS Seed Script
 * Populates the Sanity project with initial content:
 * - Site Settings (singleton)
 * - AI Model data (30 models)
 * - Team member placeholder
 * - Sample blog posts
 * 
 * Run: node seed-sanity.mjs
 */

import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || "47j8h9i3",
  dataset: process.env.SANITY_DATASET || "production",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
  apiVersion: "2024-01-01",
});

// ============================================================
// Site Settings
// ============================================================
const siteSettings = {
  _id: "siteSettings",
  _type: "siteSettings",
  heroTitle: "The Environmental Cost of",
  heroHighlight: "Artificial Intelligence",
  heroDescription: "A comprehensive analysis of energy consumption, carbon emissions, and water usage across 30 AI models — from lightweight text classifiers to frontier reasoning systems.",
  ctaExploreLabel: "Explore Data",
  ctaMethodologyLabel: "Methodology",
  ctaAgentsLabel: "Agents & Sensors",
  ctaPaperLabel: "AICo2 Paper",
  ctaPaperUrl: "https://www.dropbox.com/scl/fi/uc73r17p40un79ptj6266/M-lama-AICo2-Methodology.pdf?rlkey=kmn42xf9rocbckefxglepdjxr&st=24jvib86&dl=0",
  aboutText: "AI Energy Impact is a research-driven transparency platform analyzing the environmental footprint of artificial intelligence. Built on the Mālama AICo2 Methodology, we provide open data on energy consumption, carbon emissions, and water usage across 30+ AI models.",
  footerTagline: "Measuring what matters. Transparently.",
  contactEmail: "contribute@aipower.fyi",
  socialLinks: {
    linkedin: "",
    twitter: "",
    github: "",
  },
};

// ============================================================
// AI Models (all 30)
// ============================================================
const aiModels = [
  { task: "Video Generation - Comprehensive", model: "CogVideoX (5s Clip)", size: "N/A", energy: "30.27 - 944.44", carbon: "~380.0", water: "~1,000.0", utility: "SOTA photorealistic video / baseline FVD", source: "1-4", category: "video" },
  { task: "Text: Complex Reasoning", model: "o3-mini / DeepSeek-R1", size: "671B (R1)", energy: "1.9 - 33.6", carbon: "0.76 - 2.80", water: "7.0 - 40.0", utility: "SOTA math reasoning / AIME / Math Olympiad", source: "1, 5-9", category: "text" },
  { task: "Text Generation", model: "Gemini (Median)", size: "N/A", energy: "0.24", carbon: "0.03", water: "0.26", utility: "1360 Arena Score / General SOTA", source: "2, 10-12", category: "text" },
  { task: "Text Generation (ChatGPT)", model: "GPT-4o", size: "100B-200B", energy: "0.3 - 2.9", carbon: "0.02", water: "0.3", utility: "1400 Arena Score / SOTA reasoning", source: "10, 13", category: "text" },
  { task: "Text (Frontier)", model: "Llama 3.1 405B", size: "405B", energy: "0.43 - 1.86", carbon: "—", water: "—", utility: "MMLU: 88.6 / Frontier open model", source: "1-3, 7, 9", category: "text" },
  { task: "Text Generation (Inference)", model: "GPT-o3", size: "N/A", energy: "39.2", carbon: "—", water: "—", utility: "Advanced reasoning capabilities", source: "6", category: "text" },
  { task: "Text Generation (Inference)", model: "GPT-4.5", size: "N/A", energy: "30.5", carbon: "—", water: "—", utility: "SOTA multi-modal performance", source: "6", category: "text" },
  { task: "Image: Standard Diffusion", model: "Stable Diffusion 3 / Medium", size: "2B-8B", energy: "0.317 - 1.22", carbon: "0.24 - 0.48", water: "~2.0", utility: "High aesthetic / Text-to-image fidelity", source: "1, 2, 5, 14", category: "image" },
  { task: "Text Generation (Inference)", model: "Qwen2-72B-Instruct", size: "73B", energy: "9.86 - 9.87", carbon: "3.93", water: "—", utility: "0.6 Avg Score (HuggingFace)", source: "15-17", category: "text" },
  { task: "Text Generation (Inference)", model: "Llama 3.1 70B / DeepSeek R1", size: "70B", energy: "0.86 - 33.6", carbon: "2.042", water: "—", utility: "1350 Arena Score / Efficient mid-size", source: "5, 7", category: "text" },
  { task: "Text Generation (Inference)", model: "BLOOM", size: "176B", energy: "4", carbon: "1.5", water: "—", utility: "1100 Arena Score baseline", source: "10", category: "text" },
  { task: "Agentic Workflows", model: "Agentic AI (GPT-4 class)", size: "Large", energy: "4.32", carbon: "—", water: "—", utility: "Complex multi-step reasoning", source: "18", category: "text" },
  { task: "Text (Realistic Production)", model: "Frontier Models (GPT-4 class)", size: "Large", energy: "0.34 - 4.32", carbon: "—", water: "—", utility: "SOTA reasoning / High utility", source: "7, 18-20", category: "text" },
  { task: "Text (Conversational)", model: "LLaMA", size: "65B", energy: "0.3", carbon: "—", water: "—", utility: "1150 Arena Score", source: "10", category: "text" },
  { task: "Text Generation (Inference)", model: "InternLM2.5-7B-Chat", size: "8B", energy: "2.23", carbon: "0.89", water: "—", utility: "0.6 Avg Score (HuggingFace)", source: "15-17", category: "text" },
  { task: "Text (Basic/Simple)", model: "Llama 3.1 8B", size: "8B", energy: "0.016 - 0.24", carbon: "0.01 - 0.10", water: "0.26", utility: "MMLU: 68.4 / Efficiency trade-off", source: "1-4", category: "text" },
  { task: "Text Generation (Inference)", model: "Mixtral 8x22B", size: "141B (MoE)", energy: "0.07", carbon: "—", water: "—", utility: "Efficient MoE architecture", source: "7", category: "text" },
  { task: "Text Generation", model: "Mistral Large 2", size: "N/A", energy: "—", carbon: "1.14", water: "45", utility: "1250 Arena Score", source: "10", category: "text" },
  { task: "Text Generation (Inference)", model: "GPT-4.1 Nano / 4.1 Long", size: "N/A", energy: "0.45 - 4.83", carbon: "—", water: "—", utility: "Small is Sufficient / SOTA efficiency", source: "6, 8", category: "text" },
  { task: "Image-Text to Text", model: "InternVL2-8B", size: "8B", energy: "0.02", carbon: "0.01", water: "—", utility: "51.2 MMMU Score", source: "15, 16", category: "image" },
  { task: "Image Classification", model: "EVA02 Large", size: "305M", energy: "1.53", carbon: "0.61", water: "—", utility: "90% ImageNet Accuracy", source: "15, 16", category: "image" },
  { task: "Image Classification", model: "TinyViT-21M", size: "21M", energy: "0.53", carbon: "0.21", water: "—", utility: "90% ImageNet Accuracy", source: "15-17", category: "image" },
  { task: "Object Detection", model: "DETA-Swin-Large", size: "219M", energy: "2.40", carbon: "0.96", water: "—", utility: "0.6 Average Precision", source: "15, 16", category: "image" },
  { task: "Object Detection", model: "DETA-ResNet-50", size: "49M", energy: "1.20", carbon: "0.48", water: "—", utility: "0.5 Average Precision", source: "15, 16", category: "image" },
  { task: "Speech Recognition", model: "NVIDIA Canary-1B", size: "1B", energy: "1.04", carbon: "0.41", water: "—", utility: "33.3 WER", source: "15, 16", category: "audio" },
  { task: "Speech Recognition", model: "Whisper Base (EN)", size: "73M", energy: "0.20", carbon: "0.08", water: "—", utility: "29.5 WER", source: "15, 16", category: "audio" },
  { task: "Translation", model: "Google T5-Large", size: "738M", energy: "0.03", carbon: "0.01", water: "—", utility: "32.0 BLEU Score", source: "15, 16", category: "other" },
  { task: "Time Series Forecasting", model: "Granite-TimeSeries-PatchTST", size: "616K", energy: "0.11", carbon: "0.04", water: "—", utility: "0.6 MSE/Utility", source: "15, 16", category: "other" },
  { task: "Text Classification", model: "Fine-tuned (Task-Specific)", size: "Small", energy: "0.06 - 0.1", carbon: "—", water: "—", utility: "High accuracy (narrow task)", source: "2", category: "other" },
  { task: "Video Generation (Real-time)", model: "LTX-Video", size: "N/A", energy: "0.0005", carbon: "—", water: "—", utility: "High efficiency / 30fps HD", source: "4", category: "video" },
];

// ============================================================
// Team Members
// ============================================================
const teamMembers = [
  {
    _type: "teamMember",
    name: "Tyler Malin",
    role: "CEO & Founder",
    bio: "Early-stage investor, operator, and polymath with 5+ years in AI, Blockchain, and Sustainability Clean-Tech. Former attorney at the CFTC, providing advisory in go-to-market, product, and regulatory strategy.",
    linkedin: "",
    twitter: "",
    website: "",
    order: 1,
  },
];

// ============================================================
// Sample Blog Posts
// ============================================================
const blogPosts = [
  {
    _type: "blogPost",
    title: "Why We Built AI Energy Impact: The Case for Transparency",
    slug: { _type: "slug", current: "why-we-built-ai-energy-impact" },
    excerpt: "The AI industry consumes more energy than many countries, yet most providers don't disclose their environmental footprint. Here's why we built an open platform to change that.",
    body: [
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "The AI industry is growing at an unprecedented rate. With that growth comes an environmental cost that few are measuring and even fewer are disclosing. We built AI Energy Impact to bring transparency to this critical issue.", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "The Measurement Problem", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "Today, estimating the energy cost of a single AI query requires stitching together data from academic papers, corporate sustainability reports, and hardware benchmarks. No single source provides a complete picture. Our platform aggregates 20+ sources to create the most comprehensive view available.", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "From Estimation to Measurement", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "The real goal isn't just better estimates — it's real measurement. Through integration of Malama Sensors inside data centers, we can move from educated guesses to trusted, objective data. This is the foundation for dynamically and drastically reducing AI's environmental impact.", marks: [] }],
        markDefs: [],
      },
    ],
    author: "Tyler Malin",
    category: "methodology",
    tags: ["transparency", "methodology", "energy", "measurement"],
    publishedAt: new Date("2026-04-01").toISOString(),
    featured: true,
  },
  {
    _type: "blogPost",
    title: "Agentic AI: The Hidden Energy Multiplier",
    slug: { _type: "slug", current: "agentic-ai-hidden-energy-multiplier" },
    excerpt: "When AI agents chain multiple model calls together, energy costs don't just add up — they multiply. Our analysis reveals the true cost of autonomous AI workflows.",
    body: [
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "A single ChatGPT query uses roughly 0.3 Wh of energy. But when AI agents orchestrate multiple calls — planning, executing, verifying, and iterating — that number can balloon to 100+ Wh per task. This is the hidden energy multiplier of agentic AI.", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "The Escalation Ladder", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "Our research identifies five levels of AI energy consumption, from simple text classification at 0.016 Wh to complex agentic workflows exceeding 100 Wh per task. Understanding this escalation is critical for responsible AI deployment.", marks: [] }],
        markDefs: [],
      },
    ],
    author: "Tyler Malin",
    category: "research",
    tags: ["agentic-ai", "energy", "agents", "research"],
    publishedAt: new Date("2026-04-05").toISOString(),
    featured: true,
  },
  {
    _type: "blogPost",
    title: "Malama dMRV: Bringing Trusted Data to AI Sustainability",
    slug: { _type: "slug", current: "malama-dmrv-trusted-data" },
    excerpt: "How digital Measurement, Reporting, and Verification (dMRV) technology can transform AI sustainability from estimation to precision.",
    body: [
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "The current state of AI energy measurement relies heavily on estimation. Academic papers provide point-in-time snapshots, corporate reports offer aggregated averages, and real-time data from inside data centers remains largely unavailable. Malama's dMRV platform changes this equation.", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "h2",
        children: [{ _type: "span", text: "Hardware-Level Truth", marks: [] }],
        markDefs: [],
      },
      {
        _type: "block",
        style: "normal",
        children: [{ _type: "span", text: "By deploying sensors directly at the hardware level — monitoring power draw, thermal output, water consumption, and carbon intensity in real-time — we can replace estimates with measurements. This data, verified on the Cardano blockchain, creates an immutable record of environmental impact.", marks: [] }],
        markDefs: [],
      },
    ],
    author: "Tyler Malin",
    category: "sensors",
    tags: ["malama", "dmrv", "sensors", "blockchain", "sustainability"],
    publishedAt: new Date("2026-04-08").toISOString(),
    featured: true,
  },
];

// ============================================================
// Seed Execution
// ============================================================
async function seed() {
  console.log("🌱 Seeding Sanity CMS...\n");

  // 1. Site Settings (createOrReplace)
  console.log("📋 Creating site settings...");
  await client.createOrReplace(siteSettings);
  console.log("   ✓ Site settings created\n");

  // 2. AI Models
  console.log("🤖 Creating AI model entries...");
  let modelCount = 0;
  for (const model of aiModels) {
    const slug = model.model.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
    await client.create({
      _type: "aiModel",
      ...model,
      active: true,
    });
    modelCount++;
  }
  console.log(`   ✓ ${modelCount} AI models created\n`);

  // 3. Team Members
  console.log("👥 Creating team members...");
  for (const member of teamMembers) {
    await client.create(member);
  }
  console.log(`   ✓ ${teamMembers.length} team member(s) created\n`);

  // 4. Blog Posts
  console.log("📝 Creating blog posts...");
  for (const post of blogPosts) {
    await client.create(post);
  }
  console.log(`   ✓ ${blogPosts.length} blog post(s) created\n`);

  console.log("✅ Sanity CMS seeded successfully!");
  console.log(`   - 1 site settings document`);
  console.log(`   - ${modelCount} AI models`);
  console.log(`   - ${teamMembers.length} team member(s)`);
  console.log(`   - ${blogPosts.length} blog post(s)`);
  console.log(`\n🔗 Manage content at: https://47j8h9i3.sanity.studio/`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
