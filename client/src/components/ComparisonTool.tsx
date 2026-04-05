/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * ComparisonTool: Interactive side-by-side model comparison with visual charts.
 * Users can select up to 4 models and compare energy, carbon, and water metrics.
 */
import { useState, useMemo, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import {
  GitCompareArrows,
  Plus,
  X,
  Zap,
  Flame,
  Droplets,
  Search,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  AI_MODELS,
  AIModel,
  CATEGORY_CONFIG,
  getEnergyLevel,
  ENERGY_COLORS,
  type Category,
} from "@/lib/data";

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */
const MAX_COMPARE = 4;

const SLOT_COLORS = [
  { fill: "#2dd4bf", stroke: "#14b8a6", bg: "bg-teal-400/10", border: "border-teal-400/30", text: "text-teal-400", label: "Teal" },
  { fill: "#818cf8", stroke: "#6366f1", bg: "bg-indigo-400/10", border: "border-indigo-400/30", text: "text-indigo-400", label: "Indigo" },
  { fill: "#fb923c", stroke: "#f97316", bg: "bg-orange-400/10", border: "border-orange-400/30", text: "text-orange-400", label: "Orange" },
  { fill: "#f472b6", stroke: "#ec4899", bg: "bg-pink-400/10", border: "border-pink-400/30", text: "text-pink-400", label: "Pink" },
];

/* ------------------------------------------------------------------ */
/*  MODEL SELECTOR DROPDOWN                                            */
/* ------------------------------------------------------------------ */
function ModelSelector({
  slotIndex,
  selectedIds,
  onSelect,
}: {
  slotIndex: number;
  selectedIds: number[];
  onSelect: (model: AIModel) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    return AI_MODELS.filter(
      (m) =>
        !selectedIds.includes(m.id) &&
        (m.model.toLowerCase().includes(search.toLowerCase()) ||
          m.task.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, selectedIds]);

  // Close on outside click
  const handleBlur = (e: React.FocusEvent) => {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node)) {
      setTimeout(() => setOpen(false), 150);
    }
  };

  const color = SLOT_COLORS[slotIndex];

  return (
    <div ref={ref} className="relative" onBlur={handleBlur}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border ${color.border} ${color.bg} hover:bg-white/[0.06] transition-all group`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${color.border}`}>
          <Plus className={`w-4 h-4 ${color.text}`} />
        </div>
        <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors flex-1 text-left">
          Select model to compare...
        </span>
        <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-white/[0.08] bg-[#0f1729] shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-teal/30"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-white/30">
                  No models available
                </div>
              ) : (
                filtered.map((model) => {
                  const catConf = CATEGORY_CONFIG[model.category];
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelect(model);
                        setOpen(false);
                        setSearch("");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.04] transition-colors text-left"
                    >
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${catConf.bgClass} ${catConf.textClass} uppercase font-medium tracking-wider`}>
                        {catConf.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/90 truncate">{model.model}</p>
                        <p className="text-[11px] text-white/35 truncate">{model.task}</p>
                      </div>
                      <span className="text-xs font-mono text-teal/60 shrink-0">{model.energy} Wh</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SELECTED MODEL CARD                                                */
/* ------------------------------------------------------------------ */
function SelectedModelCard({
  model,
  slotIndex,
  onRemove,
}: {
  model: AIModel;
  slotIndex: number;
  onRemove: () => void;
}) {
  const color = SLOT_COLORS[slotIndex];
  const catConf = CATEGORY_CONFIG[model.category];
  const energyLevel = getEnergyLevel(model.energyMax);
  const energyColor = ENERGY_COLORS[energyLevel];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-xl border ${color.border} ${color.bg} p-4 relative group`}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/[0.06] hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
      >
        <X className="w-3 h-3 text-white/50 hover:text-red-400" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full mt-1 shrink-0`} style={{ backgroundColor: color.fill }} />
        <div className="min-w-0">
          <h4 className="font-display font-semibold text-sm text-white truncate">{model.model}</h4>
          <p className="text-[11px] text-white/40 truncate">{model.task}</p>
          <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${catConf.bgClass} ${catConf.textClass} uppercase font-medium tracking-wider`}>
            {catConf.label} · {model.size}
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] text-white/40 uppercase tracking-wider">Energy</span>
          </div>
          <span className={`font-mono text-sm font-semibold ${energyColor.text}`}>
            {model.energy} <span className="text-[10px] text-white/30">Wh</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] text-white/40 uppercase tracking-wider">Carbon</span>
          </div>
          <span className="font-mono text-sm font-semibold text-rose-400">
            {model.carbon !== "—" ? model.carbon : "N/A"} <span className="text-[10px] text-white/30">gCO₂e</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-white/40 uppercase tracking-wider">Water</span>
          </div>
          <span className="font-mono text-sm font-semibold text-blue-400">
            {model.water !== "—" ? model.water : "N/A"} <span className="text-[10px] text-white/30">mL</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CUSTOM CHART TOOLTIP                                               */
/* ------------------------------------------------------------------ */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1729] border border-white/[0.1] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
          <span className="text-xs text-white/70">{p.name}:</span>
          <span className="text-xs font-mono text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MAIN COMPARISON TOOL                                               */
/* ------------------------------------------------------------------ */
export default function ComparisonTool() {
  const [selectedModels, setSelectedModels] = useState<AIModel[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const selectedIds = useMemo(() => selectedModels.map((m) => m.id), [selectedModels]);

  const addModel = (model: AIModel) => {
    if (selectedModels.length < MAX_COMPARE && !selectedIds.includes(model.id)) {
      setSelectedModels((prev) => [...prev, model]);
    }
  };

  const removeModel = (id: number) => {
    setSelectedModels((prev) => prev.filter((m) => m.id !== id));
  };

  // Prepare chart data
  const barData = useMemo(() => {
    return [
      {
        metric: "Energy (Wh)",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, m.energyMax])),
      },
      {
        metric: "Carbon (gCO₂e)",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, m.carbonMax])),
      },
      {
        metric: "Water (mL)",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, m.waterMax])),
      },
    ];
  }, [selectedModels]);

  // Radar data — normalize each metric to 0-100 scale
  const radarData = useMemo(() => {
    if (selectedModels.length < 2) return [];
    const maxE = Math.max(...selectedModels.map((m) => m.energyMax), 0.001);
    const maxC = Math.max(...selectedModels.map((m) => m.carbonMax), 0.001);
    const maxW = Math.max(...selectedModels.map((m) => m.waterMax), 0.001);

    return [
      {
        metric: "Energy",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, Math.round((m.energyMax / maxE) * 100)])),
      },
      {
        metric: "Carbon",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, Math.round((m.carbonMax / maxC) * 100)])),
      },
      {
        metric: "Water",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, Math.round((m.waterMax / maxW) * 100)])),
      },
      {
        metric: "Model Size",
        ...Object.fromEntries(
          selectedModels.map((m, i) => {
            const sizeNum = parseFloat(m.size.replace(/[^0-9.]/g, "")) || 0;
            const maxSize = Math.max(...selectedModels.map((s) => parseFloat(s.size.replace(/[^0-9.]/g, "")) || 0), 0.001);
            return [`model_${i}`, Math.round((sizeNum / maxSize) * 100)];
          })
        ),
      },
      {
        metric: "Efficiency",
        ...Object.fromEntries(
          selectedModels.map((m, i) => {
            // Inverse of energy — lower energy = higher efficiency
            return [`model_${i}`, Math.round(((1 - m.energyMax / maxE) * 80) + 20)];
          })
        ),
      },
    ];
  }, [selectedModels]);

  // Efficiency comparison insight
  const insight = useMemo(() => {
    if (selectedModels.length < 2) return null;
    const sorted = [...selectedModels].sort((a, b) => a.energyMax - b.energyMax);
    const most = sorted[sorted.length - 1];
    const least = sorted[0];
    if (most.energyMax === 0 || least.energyMax === 0) return null;
    const ratio = most.energyMax / least.energyMax;
    return {
      most,
      least,
      ratio: ratio.toFixed(1),
      message: `${most.model} uses ${ratio.toFixed(1)}× more energy per prompt than ${least.model}`,
    };
  }, [selectedModels]);

  // Quick presets
  const presets = [
    { label: "Text Giants", ids: [2, 6, 7] },
    { label: "Image Models", ids: [8, 20, 21] },
    { label: "Efficient vs Frontier", ids: [16, 5, 6] },
    { label: "Speech Models", ids: [25, 26] },
  ];

  const applyPreset = (ids: number[]) => {
    const models = ids.map((id) => AI_MODELS.find((m) => m.id === id)).filter(Boolean) as AIModel[];
    setSelectedModels(models);
  };

  return (
    <section id="compare" ref={sectionRef} className="py-24 border-t border-white/[0.04]">
      <div className="container">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal/20 to-teal/5 border border-teal/20 flex items-center justify-center">
              <GitCompareArrows className="w-5 h-5 text-teal" />
            </div>
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Model Comparison
              </h2>
              <p className="text-sm text-white/40">
                Select up to {MAX_COMPARE} models to compare side-by-side
              </p>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[11px] text-white/30 uppercase tracking-wider self-center mr-1">Quick Compare:</span>
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.ids)}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-white/50 hover:text-teal hover:border-teal/20 hover:bg-teal/[0.04] transition-all"
              >
                {preset.label}
              </button>
            ))}
            {selectedModels.length > 0 && (
              <button
                onClick={() => setSelectedModels([])}
                className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] text-xs text-red-400/70 hover:text-red-400 hover:border-red-500/30 transition-all"
              >
                Clear All
              </button>
            )}
          </div>
        </motion.div>

        {/* Model selection slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          <AnimatePresence mode="popLayout">
            {selectedModels.map((model, i) => (
              <SelectedModelCard
                key={model.id}
                model={model}
                slotIndex={i}
                onRemove={() => removeModel(model.id)}
              />
            ))}
          </AnimatePresence>

          {selectedModels.length < MAX_COMPARE && (
            <ModelSelector
              slotIndex={selectedModels.length}
              selectedIds={selectedIds}
              onSelect={addModel}
            />
          )}
        </motion.div>

        {/* Empty state */}
        {selectedModels.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl"
          >
            <GitCompareArrows className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-sm text-white/30 mb-2">No models selected yet</p>
            <p className="text-xs text-white/20">
              Use the selector above or try a quick preset to get started
            </p>
          </motion.div>
        )}

        {/* Charts — show when 2+ models selected */}
        {selectedModels.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Insight banner */}
            {insight && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-xl border border-amber/20 bg-amber/[0.04] flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-amber shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/80 font-medium">{insight.message}</p>
                  <p className="text-xs text-white/40 mt-1">
                    Energy efficiency varies dramatically across model architectures and task complexity.
                    Smaller, task-specific models can be orders of magnitude more efficient.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart — absolute values */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-teal/60" />
                  <h3 className="font-display font-semibold text-sm text-white">
                    Absolute Metrics Comparison
                  </h3>
                </div>
                <p className="text-[11px] text-white/30 mb-6">
                  Raw values per prompt — energy (Wh), carbon (gCO₂e), water (mL)
                </p>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {selectedModels.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SLOT_COLORS[i].fill }} />
                      <span className="text-[11px] text-white/50 truncate max-w-[120px]">{m.model}</span>
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} barGap={4} barCategoryGap="25%">
                    <XAxis
                      dataKey="metric"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    {selectedModels.map((m, i) => (
                      <Bar
                        key={m.id}
                        dataKey={`model_${i}`}
                        name={m.model}
                        fill={SLOT_COLORS[i].fill}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar chart — normalized */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <GitCompareArrows className="w-4 h-4 text-teal/60" />
                  <h3 className="font-display font-semibold text-sm text-white">
                    Normalized Profile
                  </h3>
                </div>
                <p className="text-[11px] text-white/30 mb-6">
                  Relative comparison — each metric scaled to the highest value among selected models
                </p>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {selectedModels.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SLOT_COLORS[i].fill }} />
                      <span className="text-[11px] text-white/50 truncate max-w-[120px]">{m.model}</span>
                    </div>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis
                      tick={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    {selectedModels.map((m, i) => (
                      <Radar
                        key={m.id}
                        name={m.model}
                        dataKey={`model_${i}`}
                        stroke={SLOT_COLORS[i].stroke}
                        fill={SLOT_COLORS[i].fill}
                        fillOpacity={0.12}
                        strokeWidth={2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed metrics table */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="font-display font-semibold text-sm text-white">Detailed Metrics</h3>
                <p className="text-[11px] text-white/30 mt-0.5">Side-by-side raw values with efficiency ranking</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-6 py-3 text-left text-[11px] text-white/40 uppercase tracking-wider font-medium">Metric</th>
                      {selectedModels.map((m, i) => (
                        <th key={m.id} className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-medium" style={{ color: SLOT_COLORS[i].fill }}>
                          {m.model}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Energy row */}
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs text-white/60">Energy per Prompt</span>
                        </div>
                      </td>
                      {selectedModels.map((m, i) => {
                        const isLowest = m.energyMax === Math.min(...selectedModels.map((s) => s.energyMax));
                        const isHighest = m.energyMax === Math.max(...selectedModels.map((s) => s.energyMax));
                        return (
                          <td key={m.id} className="px-4 py-3 text-right">
                            <span className={`font-mono text-sm ${isLowest ? "text-emerald-400" : isHighest ? "text-red-400" : "text-white/70"}`}>
                              {m.energy}
                            </span>
                            <span className="text-[10px] text-white/25 ml-1">Wh</span>
                            {isLowest && selectedModels.length > 1 && (
                              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">Best</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Carbon row */}
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-xs text-white/60">Carbon Emissions</span>
                        </div>
                      </td>
                      {selectedModels.map((m, i) => {
                        const hasData = m.carbon !== "—";
                        const isLowest = hasData && m.carbonMax === Math.min(...selectedModels.filter((s) => s.carbon !== "—").map((s) => s.carbonMax));
                        return (
                          <td key={m.id} className="px-4 py-3 text-right">
                            {hasData ? (
                              <>
                                <span className={`font-mono text-sm ${isLowest ? "text-emerald-400" : "text-white/70"}`}>
                                  {m.carbon}
                                </span>
                                <span className="text-[10px] text-white/25 ml-1">gCO₂e</span>
                                {isLowest && selectedModels.filter((s) => s.carbon !== "—").length > 1 && (
                                  <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">Best</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-white/20 italic">No data</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Water row */}
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-xs text-white/60">Water Usage</span>
                        </div>
                      </td>
                      {selectedModels.map((m, i) => {
                        const hasData = m.water !== "—";
                        const isLowest = hasData && m.waterMax === Math.min(...selectedModels.filter((s) => s.water !== "—").map((s) => s.waterMax));
                        return (
                          <td key={m.id} className="px-4 py-3 text-right">
                            {hasData ? (
                              <>
                                <span className={`font-mono text-sm ${isLowest ? "text-emerald-400" : "text-white/70"}`}>
                                  {m.water}
                                </span>
                                <span className="text-[10px] text-white/25 ml-1">mL</span>
                                {isLowest && selectedModels.filter((s) => s.water !== "—").length > 1 && (
                                  <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">Best</span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-white/20 italic">No data</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Category row */}
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-xs text-white/60">Category</span>
                      </td>
                      {selectedModels.map((m) => {
                        const catConf = CATEGORY_CONFIG[m.category];
                        return (
                          <td key={m.id} className="px-4 py-3 text-right">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${catConf.bgClass} ${catConf.textClass} uppercase font-medium tracking-wider`}>
                              {catConf.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Model size row */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <span className="text-xs text-white/60">Model Size</span>
                      </td>
                      {selectedModels.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-right">
                          <span className="font-mono text-sm text-white/60">{m.size}</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <p className="text-xs text-white/25">
                Data sourced from peer-reviewed research and industry benchmarks.{" "}
                <a href="#methodology" className="text-teal/50 hover:text-teal transition-colors underline underline-offset-2">
                  View full methodology
                </a>
                {" "}·{" "}
                <a href="#contribute" className="text-teal/50 hover:text-teal transition-colors underline underline-offset-2">
                  Submit better data
                </a>
              </p>
            </div>
          </motion.div>
        )}

        {/* Single model selected — prompt to add more */}
        {selectedModels.length === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 border border-dashed border-white/[0.08] rounded-2xl"
          >
            <ArrowRight className="w-8 h-8 text-teal/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">Add at least one more model to start comparing</p>
            <p className="text-xs text-white/20 mt-1">Charts and detailed metrics will appear once you select 2+ models</p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
