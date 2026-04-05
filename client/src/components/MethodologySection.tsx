/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Methodology & Data Sourcing: Comprehensive transparency section
 * covering data origins, measurement approaches, model assumptions,
 * limitations, and an open invitation for better methods.
 */
import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Database,
  FlaskConical,
  AlertTriangle,
  Scale,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Cpu,
  Droplets,
  Flame,
  Zap,
  GitBranch,
  MessageSquare,
} from "lucide-react";

const METHODOLOGY_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/methodology-abstract-2MqCBNsT9q98iARxmYtp6y.webp";

/* ------------------------------------------------------------------ */
/*  DATA SOURCES TABLE                                                 */
/* ------------------------------------------------------------------ */
const SOURCES = [
  { id: "1-4", name: "MIT Technology Review / ML.Energy", type: "Primary", description: "Direct GPU power measurement on Nvidia H100 hardware using ML.Energy benchmarks. 500-prompt test batches for text models; prescribed denoising steps for image/video. GPU energy doubled to estimate total system energy.", url: "https://www.technologyreview.com/2025/05/20/1116331/ai-energy-demand-methodology/" },
  { id: "2, 10-12", name: "Google Cloud Infrastructure Blog", type: "Primary", description: "Google's comprehensive methodology measuring full-system dynamic power including idle machines, CPU/RAM overhead, and data center PUE of 1.09. Median Gemini text prompt: 0.24 Wh, 0.03 gCO2e, 0.26 mL water.", url: "https://cloud.google.com/blog/products/infrastructure/measuring-the-environmental-impact-of-ai-inference/" },
  { id: "5-9", name: "AI Energy Score (Hugging Face)", type: "Primary", description: "Sasha Luccioni's Code Carbon tool measuring GPU energy during inference. Standardized benchmarking across 166+ AI models with energy efficiency ratings.", url: "https://huggingface.co/spaces/EnergyStarAI/2024_leaderboard" },
  { id: "6, 8", name: "Artificial Analysis / Model Benchmarks", type: "Secondary", description: "Inference cost and energy estimates for frontier models (GPT-o3, GPT-4.5, GPT-4.1 series) derived from API pricing, token throughput, and hardware utilization estimates.", url: "https://artificialanalysis.ai/" },
  { id: "15-17", name: "Hugging Face Open LLM Leaderboard", type: "Secondary", description: "Energy consumption metrics from the Hugging Face model hub, including per-inference energy measurements for classification, detection, and generation tasks.", url: "https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard" },
  { id: "10, 13", name: "IEA / EPA / Academic Literature", type: "Reference", description: "International Energy Agency data center consumption estimates (415 TWh in 2024), EPA grid carbon intensity factors, and peer-reviewed lifecycle analysis papers.", url: "https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks" },
  { id: "14", name: "Stability AI / Diffusion Benchmarks", type: "Primary", description: "Energy measurements for Stable Diffusion 3 variants at different step counts (25 standard, 50 high-quality) and model sizes (2B-8B parameters).", url: "https://stability.ai/" },
  { id: "18-20", name: "Ampere Computing / Agentic AI Research", type: "Reference", description: "Analysis of agentic AI operational costs, persistent inference demand patterns, and non-linear infrastructure scaling for autonomous AI workflows.", url: "https://amperecomputing.com/blogs/agentic-ai" },
  { id: "—", name: "FAS Policy Memo (Jhaveri & Palat)", type: "Policy", description: "Federation of American Scientists recommendations for standardized AI energy metrics, mandatory reporting frameworks, and interagency coordination (DOE, NIST, EPA).", url: "https://fas.org/publication/measuring-and-standardizing-ais-energy-footprint/" },
  { id: "—", name: "Carnegie Mellon University", type: "Policy", description: "CMU policy recommendations for establishing standardized metrics for AI energy and environmental impacts, including lifecycle measurement frameworks.", url: "https://www.cmu.edu/work-that-matters/energy-innovation/measuring-ais-energy-and-environmental-footprint" },
];

/* ------------------------------------------------------------------ */
/*  ASSUMPTIONS TABLE                                                  */
/* ------------------------------------------------------------------ */
const ASSUMPTIONS = [
  {
    icon: Cpu,
    title: "GPU Energy Doubling Rule",
    assumption: "GPU power draw accounts for approximately 50% of total server energy consumption. We double measured GPU energy to estimate full-system energy.",
    basis: "Based on a 2024 Microsoft research paper and corroborated by Google Cloud's comprehensive methodology. Google found that GPU-only measurement (0.10 Wh) underestimates true operational energy by ~2.4x (0.24 Wh).",
    limitation: "The 50% ratio varies by workload type, hardware generation, and data center configuration. Diffusion models (image/video) may have different GPU-to-total ratios than text models.",
    confidence: "Medium",
  },
  {
    icon: Flame,
    title: "Carbon Intensity Calculation",
    assumption: "Carbon emissions are calculated as: Energy (kWh) × Grid Carbon Intensity (gCO2e/kWh), using US average grid intensity where location-specific data is unavailable.",
    basis: "Standard methodology used by EPA's Greenhouse Gas Reporting Program and Electricity Maps. US average ~400 gCO2/kWh, but ranges from ~10 (hydro-dominant) to ~900 (coal-dominant).",
    limitation: "Market-based accounting (renewable energy credits) can report dramatically different figures. FAS found that Meta's actual emissions may be 19,000x higher than market-based reports.",
    confidence: "Medium-Low",
  },
  {
    icon: Droplets,
    title: "Water Consumption Estimates",
    assumption: "Water usage is estimated based on data center cooling requirements, primarily evaporative cooling systems, scaled by PUE and regional climate factors.",
    basis: "Google reports 0.26 mL per median Gemini text prompt. Academic research suggests ~0.5 liters per interactive AI session. Video generation extrapolated from energy-to-cooling ratios.",
    limitation: "Water consumption varies enormously by cooling technology (air vs. evaporative vs. liquid), climate zone, and facility design. Many providers do not disclose water usage at all.",
    confidence: "Low",
  },
  {
    icon: Zap,
    title: "Hardware Standardization",
    assumption: "Energy measurements are normalized to Nvidia H100 GPU hardware where possible, providing a consistent baseline for comparison.",
    basis: "ML.Energy and AI Energy Score both use H100 as their standard test platform. The H100 is the most widely deployed AI inference GPU in hyperscale data centers.",
    limitation: "Real-world deployments use diverse hardware (A100, H200, TPUv5, custom ASICs). Energy efficiency varies significantly across hardware generations and architectures.",
    confidence: "Medium",
  },
  {
    icon: Scale,
    title: "PUE (Power Usage Effectiveness)",
    assumption: "We use a PUE of 1.1-1.2 for hyperscale data centers, meaning 10-20% energy overhead for cooling, power distribution, and facility operations.",
    basis: "Google reports PUE of 1.09 (industry-leading). Industry average is ~1.58 according to Uptime Institute. Hyperscale operators typically achieve 1.1-1.3.",
    limitation: "PUE is a 20+ year-old metric that measures facility efficiency but NOT how efficiently IT equipment uses delivered power. A 'good' PUE can mask wasteful hardware or software.",
    confidence: "Medium",
  },
  {
    icon: GitBranch,
    title: "Agentic AI Multiplier",
    assumption: "Agentic workflows are estimated at ~4.32 Wh per task, based on multiple sequential inference calls with a GPT-4 class model including planning, execution, and validation loops.",
    basis: "Derived from observed multi-step reasoning patterns where a single agentic task may invoke 3-10+ model calls. Ampere Computing research confirms non-linear scaling of agentic workloads.",
    limitation: "Agentic AI energy costs are highly variable — simple agents may use 2-3 calls while complex autonomous workflows could invoke dozens. Traditional 'energy per query' metrics fail to capture this.",
    confidence: "Low",
  },
];

/* ------------------------------------------------------------------ */
/*  EXPANDABLE CARD                                                    */
/* ------------------------------------------------------------------ */
function AccordionCard({
  icon: Icon,
  title,
  assumption,
  basis,
  limitation,
  confidence,
  index,
  inView,
}: (typeof ASSUMPTIONS)[0] & { index: number; inView: boolean }) {
  const [open, setOpen] = useState(false);
  const confColor =
    confidence === "Medium"
      ? "text-amber bg-amber/10 border-amber/20"
      : confidence === "Medium-Low"
        ? "text-orange-400 bg-orange-400/10 border-orange-400/20"
        : confidence === "Low"
          ? "text-signal-red bg-signal-red/10 border-signal-red/20"
          : "text-teal bg-teal/10 border-teal/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden glow-border"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 p-5 text-left group"
      >
        <Icon className="w-5 h-5 text-teal mt-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h4 className="font-display font-bold text-sm text-white group-hover:text-teal transition-colors">
              {title}
            </h4>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${confColor}`}>
              {confidence} Confidence
            </span>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">{assumption}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/30 shrink-0 mt-1 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 ml-9 space-y-4 border-t border-white/[0.04] pt-4">
              <div>
                <h5 className="text-xs font-semibold text-teal/80 uppercase tracking-wider mb-1.5">Basis & Evidence</h5>
                <p className="text-sm text-white/45 leading-relaxed">{basis}</p>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-amber/80 uppercase tracking-wider mb-1.5">Known Limitations</h5>
                <p className="text-sm text-white/45 leading-relaxed">{limitation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN SECTION                                                       */
/* ------------------------------------------------------------------ */
export default function MethodologySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="methodology" className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Visual banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10 rounded-xl border border-white/[0.06] overflow-hidden relative h-[200px] glow-border"
        >
          <img src={METHODOLOGY_BG} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1120]/80 via-[#0B1120]/50 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h3 className="font-display font-bold text-lg text-white">Measurement & Verification</h3>
            <p className="text-sm text-white/50">Building the foundation for trusted AI environmental data</p>
          </div>
        </motion.div>

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal/20 bg-teal/5 mb-5">
            <FlaskConical className="w-3.5 h-3.5 text-teal" />
            <span className="text-xs font-medium text-teal tracking-wide uppercase">
              Transparency & Methodology
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            Data Sourcing & Model Assumptions
          </h2>
          <p className="text-white/50 max-w-3xl leading-relaxed">
            We believe in radical transparency. Every number on this dashboard has a source, every calculation has an assumption, and every assumption has a known limitation. This section documents our methodology so you can evaluate, challenge, and improve it.
          </p>
        </motion.div>

        {/* ---- THE MEASUREMENT PROBLEM ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-14 rounded-xl border border-amber/15 bg-amber/[0.03] p-6 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-bold text-lg text-white mb-3">
                The Measurement Problem
              </h3>
              <div className="space-y-3 text-sm text-white/50 leading-relaxed">
                <p>
                  There is no industry-standard methodology for measuring AI's environmental footprint. Companies, in the words of the Federation of American Scientists, <span className="text-amber/80 font-medium">"report whatever they choose, however they choose."</span> The true carbon footprint of major AI providers may be up to <span className="text-amber/80 font-medium">662% higher</span> than publicly reported figures.
                </p>
                <p>
                  Current metrics like Power Usage Effectiveness (PUE) — a 20-year-old standard — measure only facility efficiency, not how efficiently IT equipment actually uses delivered power. As the FAS describes it: <span className="text-white/60 italic">"Like a car that reports how much fuel reaches the engine but not the miles per gallon of that engine."</span>
                </p>
                <p>
                  This dashboard aggregates the best available data from multiple independent sources, but we acknowledge that all estimates carry significant uncertainty. Our goal is not to present definitive numbers, but to make the scale of AI's environmental impact visible and to push for better measurement infrastructure.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- DATA SOURCES TABLE ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-teal opacity-70" />
            <h3 className="font-display font-bold text-xl text-white">Data Sources</h3>
          </div>

          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Ref</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Source</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCES.map((src, i) => {
                    const typeColor =
                      src.type === "Primary"
                        ? "text-teal bg-teal/10"
                        : src.type === "Secondary"
                          ? "text-indigo-300 bg-indigo-500/10"
                          : src.type === "Policy"
                            ? "text-violet-300 bg-violet-500/10"
                            : "text-white/50 bg-white/5";
                    return (
                      <tr
                        key={i}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 font-data text-xs text-white/40 whitespace-nowrap">
                          {src.id}
                        </td>
                        <td className="px-4 py-3 font-display font-semibold text-white/80 whitespace-nowrap text-xs">
                          {src.name}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColor}`}>
                            {src.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/45 leading-relaxed max-w-md">
                          {src.description}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal/60 hover:text-teal transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* ---- MODEL ASSUMPTIONS (ACCORDION) ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-teal opacity-70" />
            <h3 className="font-display font-bold text-xl text-white">Model Assumptions</h3>
          </div>
          <p className="text-sm text-white/40 mb-6 ml-8">
            Click each assumption to see the evidence basis and known limitations. Confidence levels indicate our assessment of reliability.
          </p>

          <div className="space-y-3">
            {ASSUMPTIONS.map((a, i) => (
              <AccordionCard key={a.title} {...a} index={i} inView={inView} />
            ))}
          </div>
        </motion.div>

        {/* ---- CALCULATION METHODOLOGY ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-6">
            <FlaskConical className="w-5 h-5 text-teal opacity-70" />
            <h3 className="font-display font-bold text-xl text-white">How We Calculate</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Energy */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 glow-border">
              <Zap className="w-5 h-5 text-amber mb-3 opacity-70" />
              <h4 className="font-display font-bold text-sm text-white mb-2">Energy (Wh/prompt)</h4>
              <div className="space-y-2 text-xs text-white/45 leading-relaxed">
                <p>
                  <span className="text-white/60 font-medium">Step 1:</span> Measure GPU power draw during inference using hardware power sensors (NVML/RAPL) or software tools (Code Carbon, ML.Energy).
                </p>
                <p>
                  <span className="text-white/60 font-medium">Step 2:</span> Double the GPU measurement to account for CPU, RAM, networking, storage, and cooling overhead (~50% rule).
                </p>
                <p>
                  <span className="text-white/60 font-medium">Step 3:</span> Apply PUE multiplier (1.1-1.2) for data center infrastructure overhead.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <code className="text-[11px] font-data text-teal/80">
                  E_total = E_gpu × 2.0 × PUE
                </code>
              </div>
            </div>

            {/* Carbon */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 glow-border">
              <Flame className="w-5 h-5 text-signal-red mb-3 opacity-70" />
              <h4 className="font-display font-bold text-sm text-white mb-2">Carbon (gCO2e/prompt)</h4>
              <div className="space-y-2 text-xs text-white/45 leading-relaxed">
                <p>
                  <span className="text-white/60 font-medium">Step 1:</span> Convert energy to kWh.
                </p>
                <p>
                  <span className="text-white/60 font-medium">Step 2:</span> Multiply by location-based grid carbon intensity (gCO2e/kWh) from EPA eGRID or Electricity Maps.
                </p>
                <p>
                  <span className="text-white/60 font-medium">Caveat:</span> Market-based accounting with RECs can show near-zero emissions even when actual grid mix is carbon-heavy.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <code className="text-[11px] font-data text-signal-red/80">
                  CO2 = E_total × GridIntensity
                </code>
              </div>
            </div>

            {/* Water */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 glow-border">
              <Droplets className="w-5 h-5 text-cyan-400 mb-3 opacity-70" />
              <h4 className="font-display font-bold text-sm text-white mb-2">Water (mL/prompt)</h4>
              <div className="space-y-2 text-xs text-white/45 leading-relaxed">
                <p>
                  <span className="text-white/60 font-medium">Step 1:</span> Estimate cooling energy from total energy and PUE breakdown.
                </p>
                <p>
                  <span className="text-white/60 font-medium">Step 2:</span> Apply Water Usage Effectiveness (WUE) ratio — liters of water per kWh of IT energy.
                </p>
                <p>
                  <span className="text-white/60 font-medium">Caveat:</span> Air-cooled facilities use minimal water; evaporative cooling facilities use significantly more. Few providers disclose WUE.
                </p>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                <code className="text-[11px] font-data text-cyan-400/80">
                  H2O = E_cooling × WUE
                </code>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ---- OPEN INVITATION ---- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-xl border border-teal/15 bg-gradient-to-br from-teal/[0.04] to-transparent p-6 sm:p-8"
        >
          <div className="flex items-start gap-4">
            <MessageSquare className="w-6 h-6 text-teal shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-bold text-lg text-white mb-3">
                We Welcome Better Methods
              </h3>
              <div className="space-y-3 text-sm text-white/50 leading-relaxed">
                <p>
                  This dashboard is a living document. We recognize that our methodology has significant gaps — particularly around water consumption, agentic AI workloads, and the variance between estimated and actual data center operations.
                </p>
                <p>
                  If you have access to better data, more rigorous measurement approaches, or can identify errors in our assumptions, we want to hear from you. The goal is not to be right — it is to be <span className="text-teal font-medium">progressively less wrong</span> and to build toward a future where AI's environmental impact is measured with trusted, objective, real-time data rather than estimates and extrapolations.
                </p>
                <p className="text-white/40 text-xs">
                  This is exactly why we advocate for hardware-level sensor integration inside data centers — to replace estimation with measurement. See the Agents & Sensors section below for our vision.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
