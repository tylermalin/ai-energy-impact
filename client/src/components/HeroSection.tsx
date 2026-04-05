/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Hero: Cinematic hero with observatory background, animated counters, and key insight
 */
import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, Flame, Droplets, Activity, FileDown } from "lucide-react";
import { AICO2_METHODOLOGY_URL } from "@/lib/data";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/hero-bg-T997qbZ6qBkA2tumzqH7yt.webp";

function AnimatedCounter({ end, suffix = "", decimals = 0, duration = 2000 }: { end: number; suffix?: string; decimals?: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="font-data">
      {count.toFixed(decimals)}{suffix}
    </span>
  );
}

const stats = [
  { icon: Activity, label: "Models Analyzed", value: 30, suffix: "", decimals: 0, color: "text-teal" },
  { icon: Zap, label: "Max Energy / Prompt", value: 944.44, suffix: " Wh", decimals: 0, color: "text-amber" },
  { icon: Flame, label: "Max Carbon / Prompt", value: 380, suffix: " g", decimals: 0, color: "text-signal-red" },
  { icon: Droplets, label: "Max Water / Prompt", value: 1000, suffix: " mL", decimals: 0, color: "text-cyan-400" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt="Abstract digital landscape representing AI energy data flows"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/60 via-[#0B1120]/40 to-[#0B1120]" />
        <div className="absolute inset-0 dot-grid opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal/20 bg-teal/5 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              <span className="text-xs font-medium text-teal tracking-wide uppercase">Live Research Data</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] tracking-tight text-white mb-6">
              The Environmental Cost of{" "}
              <span className="bg-gradient-to-r from-teal via-cyan-400 to-teal bg-clip-text text-transparent">
                Artificial Intelligence
              </span>
            </h1>

            <p className="text-lg text-white/60 leading-relaxed max-w-xl mb-10 font-light">
              A comprehensive analysis of energy consumption, carbon emissions, and water usage across 30 AI models — from lightweight text classifiers to frontier reasoning systems.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#explorer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal text-[#0B1120] font-display font-semibold text-sm hover:bg-teal/90 transition-colors shadow-lg shadow-teal/20"
              >
                Explore Data
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </a>
              <a
                href="#methodology"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 text-white/80 font-display font-medium text-sm hover:bg-white/[0.04] hover:border-white/20 transition-colors"
              >
                Methodology
              </a>
              <a
                href="#agents"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-amber/20 text-amber/80 font-display font-medium text-sm hover:bg-amber/[0.04] hover:border-amber/30 transition-colors"
              >
                Agents & Sensors
              </a>
              <a
                href={AICO2_METHODOLOGY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-teal/20 text-teal/80 font-display font-medium text-sm hover:bg-teal/[0.04] hover:border-teal/30 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                AICo2 Paper
              </a>
            </div>
          </motion.div>

          {/* Right: Stat gauges */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="relative p-5 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm glow-border group"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mb-3 opacity-70 group-hover:opacity-100 transition-opacity`} />
                <div className={`text-2xl sm:text-3xl font-extrabold ${stat.color} mb-1`}>
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} decimals={stat.decimals} duration={2000 + i * 300} />
                </div>
                <div className="text-xs text-white/40 font-medium uppercase tracking-wider">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
