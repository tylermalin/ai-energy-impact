/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Agents & Sensors: Expanded section covering agentic AI's compounding
 * energy costs and the Malama Sensors vision for trusted, objective
 * data center monitoring that enables dynamic impact reduction.
 */
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Bot,
  Workflow,
  TrendingUp,
  AlertTriangle,
  Radio,
  Shield,
  BarChart3,
  Zap,
  ArrowRight,
  Layers,
  Eye,
  Link2,
  Cpu,
  Droplets,
  Flame,
  Wind,
  FileDown,
  ExternalLink,
} from "lucide-react";
import { AICO2_METHODOLOGY_URL } from "@/lib/data";
import { Link } from "wouter";

const SENSOR_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/sensor-datacenter-TZds8SaGEfSaUzEUwyS42f.webp";

/* ------------------------------------------------------------------ */
/*  AGENTIC AI COMPARISON DATA                                         */
/* ------------------------------------------------------------------ */
const AGENTIC_COMPARISON = [
  { label: "Single Text Query", model: "Llama 3.1 8B", energy: "0.016 Wh", calls: "1", color: "bg-emerald-400" },
  { label: "Standard Chat Session", model: "GPT-4o", energy: "0.3–2.9 Wh", calls: "1–5", color: "bg-amber" },
  { label: "Complex Reasoning", model: "o3-mini / DeepSeek-R1", energy: "1.9–33.6 Wh", calls: "1–3", color: "bg-orange-400" },
  { label: "Agentic Workflow", model: "GPT-4 class Agent", energy: "4.32+ Wh", calls: "3–10+", color: "bg-signal-red" },
  { label: "Autonomous Agent Loop", model: "Multi-model Pipeline", energy: "10–100+ Wh", calls: "10–50+", color: "bg-red-600" },
];

/* ------------------------------------------------------------------ */
/*  SENSOR CAPABILITIES                                                */
/* ------------------------------------------------------------------ */
const SENSOR_CAPABILITIES = [
  {
    icon: Zap,
    title: "Real-Time Energy Metering",
    description: "Hardware-level power sensors at the rack, server, and GPU level — measuring actual energy consumption per workload, not estimates derived from GPU draw alone.",
    metric: "kWh per inference",
  },
  {
    icon: Flame,
    title: "Carbon Emissions Tracking",
    description: "Live grid carbon intensity integration combined with actual energy measurements to calculate real-time, location-based carbon emissions — not market-based credits.",
    metric: "gCO2e per prompt",
  },
  {
    icon: Droplets,
    title: "Water Consumption Monitoring",
    description: "Flow sensors on cooling systems measuring actual water consumption per rack, correlated with compute workloads to attribute water usage to specific AI tasks.",
    metric: "mL per inference",
  },
  {
    icon: Wind,
    title: "Thermal & Airflow Analysis",
    description: "Temperature, humidity, and airflow sensors creating a real-time thermal map of the data center — identifying cooling inefficiencies and hot spots for optimization.",
    metric: "°C / CFM per zone",
  },
];

/* ------------------------------------------------------------------ */
/*  IMPACT PIPELINE                                                    */
/* ------------------------------------------------------------------ */
const PIPELINE_STEPS = [
  {
    icon: Radio,
    title: "Deploy Sensors",
    description: "IoT sensors installed at rack, server, and cooling system level across the data center.",
  },
  {
    icon: Eye,
    title: "Measure Everything",
    description: "Real-time energy, water, thermal, and airflow data streamed continuously — not sampled or estimated.",
  },
  {
    icon: Link2,
    title: "Verify On-Chain",
    description: "Measurement data anchored to blockchain (Cardano) for tamper-proof, immutable audit trails — creating trusted, objective records.",
  },
  {
    icon: BarChart3,
    title: "Automated Analysis",
    description: "Machine learning models analyze sensor data to identify inefficiencies, predict failures, and recommend optimizations.",
  },
  {
    icon: Layers,
    title: "Dynamic Optimization",
    description: "Automated workload scheduling, cooling adjustments, and resource allocation based on real-time environmental data.",
  },
  {
    icon: Shield,
    title: "Verified Reporting",
    description: "Standardized, auditable environmental reports generated from actual measurements — replacing self-reported estimates.",
  },
];

/* ------------------------------------------------------------------ */
/*  MAIN SECTION                                                       */
/* ------------------------------------------------------------------ */
export default function AgentsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="agents" className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ============================================================ */}
        {/* PART 1: AGENTIC AI — THE COMPOUNDING COST                    */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber/20 bg-amber/5 mb-5">
            <Bot className="w-3.5 h-3.5 text-amber" />
            <span className="text-xs font-medium text-amber tracking-wide uppercase">
              Agentic AI & Sensors
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            The Compounding Cost of Autonomous AI
          </h2>
          <p className="text-white/50 max-w-3xl leading-relaxed">
            As AI evolves from single-query chatbots to autonomous agents that plan, execute, and iterate, the energy footprint doesn't just grow — it compounds. Traditional "energy per query" metrics fail to capture the true cost of agentic workflows.
          </p>
        </motion.div>

        {/* Agentic vs Traditional comparison */}
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 mb-14">
          {/* Left: The problem */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 glow-border"
          >
            <Workflow className="w-5 h-5 text-amber mb-4 opacity-70" />
            <h3 className="font-display font-bold text-base text-white mb-4">
              From Episodic to Continuous
            </h3>
            <div className="space-y-3 text-sm text-white/45 leading-relaxed">
              <p>
                A single agentic workflow can involve <span className="text-white/70 font-medium">multiple model calls, data retrieval, validation loops, and downstream integrations</span>. Unlike a simple chatbot query, agents create persistent, background compute demand.
              </p>
              <p>
                As Ampere Computing's research (April 2026) warns: infrastructure demand from agentic AI grows in <span className="text-amber font-medium">non-linear ways</span>. Automated decisions generate follow-up processes, and workflows branch into additional tasks. This multiplicative effect is easily underestimated.
              </p>
              <p>
                The FAS policy memo acknowledges this shift directly: <span className="text-white/60 italic">"When we move from chatbots to agentic AI systems that plan, act, remember, and iterate autonomously, traditional 'energy per query' metrics no longer capture the full picture."</span>
              </p>
            </div>
          </motion.div>

          {/* Right: Energy escalation ladder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 glow-border"
          >
            <TrendingUp className="w-5 h-5 text-signal-red mb-4 opacity-70" />
            <h3 className="font-display font-bold text-base text-white mb-5">
              Energy Escalation Ladder
            </h3>
            <div className="space-y-3">
              {AGENTIC_COMPARISON.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-3 group"
                >
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-display font-semibold text-white/80">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-white/30 font-data">
                        {item.model}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-data font-semibold text-white/70">
                      {item.energy}
                    </span>
                    <span className="text-[10px] text-white/30 ml-2">
                      {item.calls} calls
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-white/[0.04]">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/35 leading-relaxed">
                  Autonomous agent loops can invoke 10-50+ model calls per task. At enterprise scale with thousands of concurrent agents, energy costs compound exponentially. Current measurement infrastructure cannot track this.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Key agentic AI stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid sm:grid-cols-3 gap-4 mb-20"
        >
          {[
            {
              stat: "10-50x",
              label: "More model calls per task vs. single query",
              color: "text-amber",
              border: "border-amber/15",
            },
            {
              stat: "Non-Linear",
              label: "Infrastructure demand growth as agents scale",
              color: "text-signal-red",
              border: "border-signal-red/15",
            },
            {
              stat: "Always-On",
              label: "Persistent compute demand, not episodic usage",
              color: "text-rose-400",
              border: "border-rose-400/15",
            },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.25 + i * 0.05 }}
              className={`rounded-xl border ${item.border} bg-white/[0.02] p-5 text-center`}
            >
              <div className={`font-display font-extrabold text-2xl ${item.color} mb-2`}>
                {item.stat}
              </div>
              <div className="text-xs text-white/40">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ============================================================ */}
        {/* PART 2: THE MALAMA SENSORS VISION                            */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal/20 bg-teal/5 mb-5">
            <Radio className="w-3.5 h-3.5 text-teal" />
            <span className="text-xs font-medium text-teal tracking-wide uppercase">
              The Solution: Trusted Measurement
            </span>
          </div>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-4">
            From Estimation to Observation
          </h2>
          <p className="text-white/50 max-w-3xl leading-relaxed">
            Every number on this dashboard is an estimate. The real goal is to replace estimation with measurement — deploying hardware-level sensors inside data centers to create an environment of trusted, objective, verifiable data that can dynamically and drastically reduce AI's environmental impact.
          </p>
        </motion.div>

        {/* Sensor datacenter visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mb-10 rounded-xl border border-white/[0.06] overflow-hidden relative h-[240px] glow-border"
        >
          <img src={SENSOR_IMG} alt="Data center with IoT sensors" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/90 via-[#0B1120]/30 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <h3 className="font-display font-bold text-lg text-white">Hardware-Level Sensor Integration</h3>
            <p className="text-sm text-white/50">IoT sensors deployed at rack, server, and cooling system level — measuring actual environmental impact, not estimates.</p>
          </div>
        </motion.div>

        {/* The gap visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="mb-14"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current state */}
            <div className="rounded-xl border border-signal-red/15 bg-signal-red/[0.03] p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-signal-red" />
                <h4 className="font-display font-bold text-sm text-signal-red">Today: Estimation & Opacity</h4>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Software-based GPU power measurement (CodeCarbon, NVML)",
                  "Rule-of-thumb extrapolation: GPU = ~50% of total energy",
                  "Average PUE values applied uniformly across facilities",
                  "Regional grid carbon intensity averages (not real-time)",
                  "Water consumption rarely disclosed, often unknown",
                  "Self-reported data with no independent verification",
                  "True emissions may be 662% higher than reported (FAS)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/40 leading-relaxed">
                    <span className="text-signal-red/60 mt-0.5">×</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Future state */}
            <div className="rounded-xl border border-teal/15 bg-teal/[0.03] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-teal" />
                <h4 className="font-display font-bold text-sm text-teal">Future: Measurement & Trust</h4>
              </div>
              <ul className="space-y-2.5">
                {[
                  "Hardware-level sensors at rack, server, and GPU level",
                  "Actual energy measurement per workload, per inference",
                  "Real-time PUE calculated per facility, per hour",
                  "Live grid carbon intensity from Electricity Maps / sensors",
                  "Flow sensors on cooling systems measuring actual water use",
                  "Blockchain-verified, tamper-proof measurement records",
                  "Automated dynamic optimization reducing impact in real-time",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/40 leading-relaxed">
                    <span className="text-teal/80 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Sensor Capabilities Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-14"
        >
          <h3 className="font-display font-bold text-xl text-white mb-6">
            Sensor Capabilities for Data Centers
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SENSOR_CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.45 + i * 0.05 }}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 glow-border group"
              >
                <cap.icon className="w-5 h-5 text-teal mb-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                <h4 className="font-display font-bold text-sm text-white mb-2 group-hover:text-teal transition-colors">
                  {cap.title}
                </h4>
                <p className="text-xs text-white/40 leading-relaxed mb-3">
                  {cap.description}
                </p>
                <div className="px-2 py-1 rounded bg-teal/10 border border-teal/15 inline-block">
                  <span className="text-[10px] font-data text-teal/70">{cap.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pipeline: Deploy → Measure → Verify → Analyze → Optimize → Report */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-14"
        >
          <h3 className="font-display font-bold text-xl text-white mb-6">
            The Measurement-to-Optimization Pipeline
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.55 + i * 0.05 }}
                className="relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 glow-border group"
              >
                {/* Step number */}
                <div className="absolute top-4 right-4 text-[10px] font-data text-white/15 font-bold">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <step.icon className="w-5 h-5 text-teal mb-3 opacity-70 group-hover:opacity-100 transition-opacity" />
                <h4 className="font-display font-bold text-sm text-white mb-2 group-hover:text-teal transition-colors">
                  {step.title}
                </h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  {step.description}
                </p>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal/20 z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Malama dMRV connection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl border border-teal/15 bg-gradient-to-br from-teal/[0.04] via-teal/[0.02] to-transparent p-6 sm:p-8 mb-14"
        >
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal to-teal-dim flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#0B1120]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Malama dMRV: Trusted Environmental Data
                  </h3>
                  <p className="text-xs text-teal/60">Digital Measurement, Reporting & Verification</p>
                </div>
              </div>
              <div className="space-y-3 text-sm text-white/50 leading-relaxed">
                <p>
                  The Malama dMRV (digital Measurement, Reporting, and Verification) infrastructure — already proven in carbon credit verification for agriculture and land management — provides the technological foundation for trusted data center monitoring.
                </p>
                <p>
                  By combining <span className="text-teal font-medium">IoT sensors</span> for real-time environmental data collection, <span className="text-teal font-medium">machine learning analysis</span> for pattern recognition and optimization, and <span className="text-teal font-medium">blockchain verification</span> (Cardano) for tamper-proof audit trails, the platform creates an environment where environmental claims are backed by verifiable, objective measurements — not self-reported estimates.
                </p>
                <p>
                  Extending this infrastructure into data centers means every energy reading, every water flow measurement, and every carbon calculation is recorded immutably on-chain. Operators, regulators, and the public can independently verify environmental impact claims, creating the accountability that the FAS, CMU, and industry researchers have called for.
                </p>
                <a
                  href={AICO2_METHODOLOGY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 mt-4 px-5 py-3 rounded-lg bg-teal text-[#0B1120] font-display font-semibold text-sm hover:bg-teal/90 transition-all shadow-lg shadow-teal/20 group"
                >
                  <FileDown className="w-4.5 h-4.5 group-hover:translate-y-0.5 transition-transform" />
                  Read the Full Mālama AICo2 Methodology
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>
                <Link
                  href="/sensors"
                  className="inline-flex items-center gap-2.5 mt-3 px-5 py-3 rounded-lg border border-teal/30 text-teal font-display font-semibold text-sm hover:bg-teal/10 transition-all group"
                >
                  <Radio className="w-4.5 h-4.5" />
                  Explore Live Sensor Demo
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Key stats */}
            <div className="flex flex-col gap-3 shrink-0">
              {[
                { label: "Sensor Data", value: "Real-Time", color: "text-teal" },
                { label: "Verification", value: "On-Chain", color: "text-violet-300" },
                { label: "Audit Trail", value: "Immutable", color: "text-cyan-400" },
                { label: "Optimization", value: "AI-Driven", color: "text-amber" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-center min-w-[140px]"
                >
                  <div className={`font-display font-bold text-sm ${item.color}`}>{item.value}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* The vision: impact reduction potential */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.65 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8"
        >
          <Cpu className="w-6 h-6 text-teal mb-4 opacity-70" />
          <h3 className="font-display font-bold text-lg text-white mb-4">
            The Impact: What Trusted Data Enables
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "Dynamic Workload Scheduling",
                description: "Route AI inference to facilities with the lowest real-time carbon intensity, shifting compute to when and where clean energy is available.",
                icon: Workflow,
              },
              {
                title: "Cooling Optimization",
                description: "Real-time thermal data enables predictive cooling adjustments — reducing water consumption by matching cooling output to actual heat load, not worst-case estimates.",
                icon: Droplets,
              },
              {
                title: "Hardware Utilization",
                description: "Identify idle capacity and underutilized servers that consume energy without productive output. Google found idle machines are a significant hidden cost.",
                icon: Cpu,
              },
              {
                title: "Regulatory Compliance",
                description: "Automated, verifiable reporting that meets emerging EU AI Act requirements and anticipated US mandatory disclosure frameworks (FAS/CMU recommendations).",
                icon: Shield,
              },
              {
                title: "Carbon-Aware Computing",
                description: "Schedule training runs and batch inference during periods of high renewable energy availability, verified by real-time grid data rather than annual averages.",
                icon: Flame,
              },
              {
                title: "Accountability & Trust",
                description: "Replace the current 662% reporting gap with blockchain-verified measurements that investors, regulators, and the public can independently audit.",
                icon: Eye,
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.3, delay: 0.7 + i * 0.04 }}
                className="group"
              >
                <item.icon className="w-4 h-4 text-teal/60 mb-2 group-hover:text-teal transition-colors" />
                <h4 className="font-display font-bold text-sm text-white mb-1.5 group-hover:text-teal transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-white/40 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
