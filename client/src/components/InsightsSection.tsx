/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Insights (Phase 3b+): facts derived live from the DB so they stay
 * truthful as data refreshes. Falls back to a static set when the DB
 * query is loading / empty.
 */
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { TrendingUp, Scale, Leaf, Cpu, Droplets, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { adaptDbRow, type DbRow } from "@/lib/dbModelsAdapter";
import { ADAPTED_MODELS, ENERGY_UNIT_LABEL, type DisplayModel } from "@/lib/modelsAdapter";

const CARBON_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/carbon-abstract-RZpT6jqxkbDp5HsEfrN7GV.webp";
const WATER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/water-abstract-MuKTKRajGWhcmjUwMnyKiH.webp";

interface Insight {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  accent: string;
  iconColor: string;
}

function fmtNum(n: number, digits = 3): string {
  if (n === 0) return "0";
  if (n < 0.001) return n.toExponential(2);
  if (n < 1) return n.toFixed(digits);
  if (n < 100) return n.toFixed(1);
  return Math.round(n).toLocaleString();
}

/** Build 6 live insights from the current dataset. */
function deriveInsights(models: DisplayModel[]): Insight[] {
  if (models.length === 0) return STATIC_FALLBACK_INSIGHTS;

  const withEnergy = models.filter((m) => (m.energyWh ?? 0) > 0);
  const text = withEnergy.filter((m) => m.category === "text");
  const image = withEnergy.filter((m) => m.category === "image");
  const video = withEnergy.filter((m) => m.category === "video");
  const code = withEnergy.filter((m) => m.category === "code");

  const insights: Insight[] = [];

  // Insight 1 — Total energy gap across all measured rows.
  if (withEnergy.length >= 2) {
    const sorted = [...withEnergy].sort((a, b) => (a.energyWh ?? 0) - (b.energyWh ?? 0));
    const lo = sorted[0];
    const hi = sorted[sorted.length - 1];
    const ratio = (hi.energyWh ?? 1) / (lo.energyWh ?? 0.0001);
    insights.push({
      icon: TrendingUp,
      title: `${Math.round(ratio).toLocaleString()}× Energy Gap`,
      description:
        `The highest-energy model in this dataset (${hi.modelName} at ${fmtNum(hi.energyWh ?? 0)} ${ENERGY_UNIT_LABEL[hi.energyUnit].short}) consumes ${Math.round(ratio).toLocaleString()}× more energy than the most efficient one (${lo.modelName} at ${fmtNum(lo.energyWh ?? 0)} ${ENERGY_UNIT_LABEL[lo.energyUnit].short}). Units differ across categories — see methodology.`,
      accent: "from-rose-500 to-amber-500",
      iconColor: "text-rose-400",
    });
  }

  // Insight 2 — Text-category range.
  if (text.length >= 2) {
    const tSorted = [...text].sort((a, b) => (a.energyWh ?? 0) - (b.energyWh ?? 0));
    const tLo = tSorted[0];
    const tHi = tSorted[tSorted.length - 1];
    const tRatio = (tHi.energyWh ?? 1) / (tLo.energyWh ?? 0.0001);
    insights.push({
      icon: Scale,
      title: "Text Models: Wide Spectrum",
      description: `Text generation spans from ${fmtNum(tLo.energyWh ?? 0)} Wh (${tLo.modelName}) to ${fmtNum(tHi.energyWh ?? 0)} Wh (${tHi.modelName}) — a ${Math.round(tRatio)}× range within the same task category, driven by model size and reasoning depth.`,
      accent: "from-indigo-500 to-violet-500",
      iconColor: "text-indigo-400",
    });
  }

  // Insight 3 — Reasoning tax.
  const reasoningRows = models.filter((m) => m.taskClass === "reasoning" && (m.energyWh ?? 0) > 0);
  const chatBaseline = text.filter((m) => m.taskClass === "text_generation");
  if (reasoningRows.length > 0 && chatBaseline.length > 0) {
    const avgReasoning = reasoningRows.reduce((s, m) => s + (m.energyWh ?? 0), 0) / reasoningRows.length;
    const medianChat = chatBaseline
      .map((m) => m.energyWh ?? 0)
      .sort((a, b) => a - b)[Math.floor(chatBaseline.length / 2)] || 0;
    if (medianChat > 0) {
      const tax = avgReasoning / medianChat;
      insights.push({
        icon: Zap,
        title: "Reasoning Tax",
        description: `Reasoning-class models (chain-of-thought, o-series) consume on average ${tax.toFixed(1)}× more energy per inference than standard chat models — driven by token inflation and KV cache pressure (Mālama AICo2 Methodology Section 5.3).`,
        accent: "from-amber-500 to-orange-500",
        iconColor: "text-amber-400",
      });
    }
  }

  // Insight 4 — Smallest efficient model.
  const efficient = [...withEnergy].sort((a, b) => (a.energyWh ?? 0) - (b.energyWh ?? 0))[0];
  if (efficient) {
    insights.push({
      icon: Cpu,
      title: "Small Models, Big Impact",
      description: `${efficient.modelName} (${efficient.parameters ?? "small"}) achieves task accuracy at just ${fmtNum(efficient.energyWh ?? 0)} ${ENERGY_UNIT_LABEL[efficient.energyUnit].short} per inference — proof that smaller, specialized models can deliver high utility at a fraction of frontier-model energy.`,
      accent: "from-teal to-cyan-400",
      iconColor: "text-teal",
    });
  }

  // Insight 5 — Hidden water cost.
  const waterRows = models.filter((m) => (m.waterMl ?? 0) > 0);
  const maxWaterRow = waterRows.reduce<DisplayModel | null>(
    (acc, m) => (acc == null || (m.waterMl ?? 0) > (acc.waterMl ?? 0) ? m : acc),
    null,
  );
  if (maxWaterRow && (maxWaterRow.waterMl ?? 0) > 1) {
    insights.push({
      icon: Droplets,
      title: "Hidden Water Cost",
      description: `${maxWaterRow.modelName} draws an estimated ${fmtNum(maxWaterRow.waterMl ?? 0)} mL of cooling water per inference under industry-average WUE (1.9 L/kWh). Confidence is low — see methodology.`,
      accent: "from-cyan-500 to-blue-500",
      iconColor: "text-cyan-400",
    });
  }

  // Insight 6 — Code agent energy (if any code rows exist).
  if (code.length >= 2) {
    const cSorted = [...code].sort((a, b) => (b.energyWh ?? 0) - (a.energyWh ?? 0));
    const cHi = cSorted[0];
    insights.push({
      icon: Leaf,
      title: "Code Agents Compound",
      description: `Code-task energy is dominated by agentic workflows. ${cHi.modelName} (${cHi.scaffold ?? "scaffolded"}) uses about ${fmtNum(cHi.energyWh ?? 0)} Wh per SWE-bench task — multi-step tool use, not a single inference call.`,
      accent: "from-emerald-500 to-teal",
      iconColor: "text-emerald-400",
    });
  }

  // Pad up to 6 with static fallback if we ran out of derived insights.
  while (insights.length < 6 && insights.length < STATIC_FALLBACK_INSIGHTS.length) {
    insights.push(STATIC_FALLBACK_INSIGHTS[insights.length]);
  }
  return insights.slice(0, 6);
}

/** Backup set, only used when the DB query returns nothing. */
const STATIC_FALLBACK_INSIGHTS: Insight[] = [
  {
    icon: TrendingUp,
    title: "Wide Energy Gap",
    description: "Energy per inference varies by orders of magnitude across AI tasks. Video generation dwarfs everything else; classification stays remarkably efficient.",
    accent: "from-rose-500 to-amber-500",
    iconColor: "text-rose-400",
  },
  {
    icon: Scale,
    title: "Text Models: Wide Spectrum",
    description: "Text-generation energy spans from sub-watt small models to multi-Wh frontier reasoning systems, driven by model size and chain-of-thought depth.",
    accent: "from-indigo-500 to-violet-500",
    iconColor: "text-indigo-400",
  },
  {
    icon: Leaf,
    title: "MoE Architecture Wins",
    description: "Mixture-of-experts models route each token to a subset of parameters, dramatically reducing energy vs dense models of similar capability.",
    accent: "from-emerald-500 to-teal",
    iconColor: "text-emerald-400",
  },
  {
    icon: Cpu,
    title: "Small Models, Big Impact",
    description: "Task-specific fine-tuned models can deliver high accuracy at a fraction of the environmental cost of frontier models.",
    accent: "from-teal to-cyan-400",
    iconColor: "text-teal",
  },
  {
    icon: Droplets,
    title: "Hidden Water Cost",
    description: "Estimates put video generation water use in the range of 200 to 1,000 mL per prompt for cooling, with high variance by facility type. Confidence is low — see methodology.",
    accent: "from-cyan-500 to-blue-500",
    iconColor: "text-cyan-400",
  },
  {
    icon: Zap,
    title: "Reasoning Tax",
    description: "Chain-of-thought and agentic reasoning impose a measurable energy premium — typically 13–25× the chat baseline per the Mālama AICo2 Methodology.",
    accent: "from-amber-500 to-orange-500",
    iconColor: "text-amber-400",
  },
];

export default function InsightsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const dbQuery = trpc.cms.modelsForDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const insights = useMemo(() => {
    const dbRows = (dbQuery.data?.rows ?? []) as DbRow[];
    const source = dbRows.length > 0 ? dbRows.map(adaptDbRow) : ADAPTED_MODELS;
    return deriveInsights(source);
  }, [dbQuery.data]);

  return (
    <section className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-3">
            Key Findings
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Insights derived live from the current dataset. Recomputed every time models or measurements update.
          </p>
        </motion.div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 * i }}
              className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 glow-border group overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${insight.accent} opacity-40 group-hover:opacity-80 transition-opacity`} />
              <insight.icon className={`w-5 h-5 ${insight.iconColor} mb-4 opacity-70 group-hover:opacity-100 transition-opacity`} />
              <h3 className="font-display font-bold text-base text-white mb-2 group-hover:text-teal transition-colors">
                {insight.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {insight.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Visual cards row */}
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="rounded-xl border border-white/[0.06] overflow-hidden glow-border relative group h-[240px]"
          >
            <img src={CARBON_IMG} alt="Carbon emissions visualization" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/90 via-[#0B1120]/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-display font-bold text-lg text-white mb-1">Carbon Emissions</h3>
              <p className="text-sm text-white/50">All emissions figures derived from energy × grid intensity (US 2024 avg 402.49 gCO₂e/kWh) per the Mālama AICo2 Methodology.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl border border-white/[0.06] overflow-hidden glow-border relative group h-[240px]"
          >
            <img src={WATER_IMG} alt="Water consumption visualization" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/90 via-[#0B1120]/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <h3 className="font-display font-bold text-lg text-white mb-1">Water Consumption</h3>
              <p className="text-sm text-white/50">Water figures derived from energy × WUE (industry average 1.9 L/kWh). Confidence is low — see methodology.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
