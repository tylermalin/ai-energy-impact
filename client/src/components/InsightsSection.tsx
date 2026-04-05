/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Insights: Key findings presented as observatory-style cards with visual accents
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingUp, Scale, Leaf, Cpu, Droplets, Zap } from "lucide-react";

const CARBON_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/carbon-abstract-RZpT6jqxkbDp5HsEfrN7GV.webp";
const WATER_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/water-abstract-MuKTKRajGWhcmjUwMnyKiH.webp";

const insights = [
  {
    icon: TrendingUp,
    title: "1,888,880x Energy Gap",
    description: "The most energy-intensive AI task (CogVideoX video generation at 944 Wh) consumes nearly 1.9 million times more energy per prompt than the most efficient (LTX-Video at 0.0005 Wh).",
    accent: "from-rose-500 to-amber-500",
    iconColor: "text-rose-400",
  },
  {
    icon: Scale,
    title: "Text Models: Wide Spectrum",
    description: "Text generation spans from 0.016 Wh (Llama 3.1 8B) to 39.2 Wh (GPT-o3) — a 2,450x range within the same task category, driven by model size and reasoning depth.",
    accent: "from-indigo-500 to-violet-500",
    iconColor: "text-indigo-400",
  },
  {
    icon: Leaf,
    title: "MoE Architecture Wins",
    description: "Mixtral 8x22B (141B params, MoE) uses only 0.07 Wh — dramatically less than dense models of similar capability, demonstrating mixture-of-experts as a key efficiency strategy.",
    accent: "from-emerald-500 to-teal",
    iconColor: "text-emerald-400",
  },
  {
    icon: Cpu,
    title: "Small Models, Big Impact",
    description: "Task-specific fine-tuned models (0.06 Wh) and Llama 3.1 8B (0.016 Wh) prove that smaller, specialized models can deliver high accuracy at a fraction of the environmental cost.",
    accent: "from-teal to-cyan-400",
    iconColor: "text-teal",
  },
  {
    icon: Droplets,
    title: "Hidden Water Cost",
    description: "Video generation consumes up to 1,000 mL of water per prompt for cooling — equivalent to a full water bottle. Even text models like Mistral Large 2 use 45 mL per prompt.",
    accent: "from-cyan-500 to-blue-500",
    iconColor: "text-cyan-400",
  },
  {
    icon: Zap,
    title: "Reasoning Tax",
    description: "Chain-of-thought and agentic reasoning (GPT-o3 at 39.2 Wh, Agentic AI at 4.32 Wh) impose a significant energy premium — the cost of \"thinking harder\" is measurable.",
    accent: "from-amber-500 to-orange-500",
    iconColor: "text-amber-400",
  },
];

export default function InsightsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

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
            Critical insights from analyzing energy, carbon, and water data across 30 AI models and 10+ task categories.
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
              {/* Top accent line */}
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
              <p className="text-sm text-white/50">Video generation produces up to 380 gCO2e per prompt — equivalent to driving 1.5 km in a car.</p>
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
              <p className="text-sm text-white/50">Data center cooling for a single video generation prompt can consume up to 1 liter of water.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
