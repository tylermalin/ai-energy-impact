/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Footer: Minimal observatory-style footer
 */
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer id="agents" className="border-t border-white/[0.06] py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-dim flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#0B1120]" />
              </div>
              <span className="font-display font-bold text-sm text-white">AI Energy Impact</span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-xs">
              Comprehensive analysis of AI model energy consumption, carbon emissions, and water usage. Data compiled from peer-reviewed research and industry reports.
            </p>
          </div>

          {/* Data Sources */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/60 mb-4">Data Sources</h4>
            <ul className="space-y-2">
              {["Academic Research Papers", "Industry Sustainability Reports", "Model Benchmarks (MMLU, Arena)", "HuggingFace Energy Metrics"].map((s) => (
                <li key={s} className="text-xs text-white/35 hover:text-white/60 transition-colors">{s}</li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/60 mb-4">About</h4>
            <p className="text-xs text-white/35 leading-relaxed">
              This dashboard aggregates data from 20+ research sources to provide a unified view of AI's environmental footprint. All energy values are per-prompt estimates under standard inference conditions.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              <span className="text-[10px] text-teal/60 uppercase tracking-wider font-medium">Live Data</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-white/25">
            2025 AI Energy & Environmental Impact Dashboard. Research data compiled for educational purposes.
          </p>
          <p className="text-[11px] text-white/25 font-data">
            v1.0 — 30 models · 20+ sources
          </p>
        </div>
      </div>
    </footer>
  );
}
