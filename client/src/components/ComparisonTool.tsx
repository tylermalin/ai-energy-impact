/**
 * ComparisonTool (Phase 3b+) — Quick Compare for 2–4 models.
 *
 * Reads from MySQL via cms.modelsForDashboard. Falls back to
 * ADAPTED_MODELS when the DB query is loading / empty.
 *
 * Cross-category comparison: users can pick Veo 3.1 (video) next to
 * GPT-5.5 (text). Each row in the detail table labels its own unit
 * (Wh/inference vs Wh/video-second), so cross-category comparisons
 * are honest rather than misleading.
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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
import { trpc } from "@/lib/trpc";
import { adaptDbRow, type DbRow } from "@/lib/dbModelsAdapter";
import {
  ADAPTED_MODELS,
  CATEGORY_DISPLAY,
  ENERGY_UNIT_LABEL,
  type DisplayModel,
} from "@/lib/modelsAdapter";
import { ClassificationBadge } from "@/components/ProvenanceBadges";

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */
const MAX_COMPARE = 4;

const SLOT_COLORS = [
  { fill: "#2dd4bf", stroke: "#14b8a6", bg: "bg-teal-400/10", border: "border-teal-400/30", text: "text-teal-400" },
  { fill: "#818cf8", stroke: "#6366f1", bg: "bg-indigo-400/10", border: "border-indigo-400/30", text: "text-indigo-400" },
  { fill: "#fb923c", stroke: "#f97316", bg: "bg-orange-400/10", border: "border-orange-400/30", text: "text-orange-400" },
  { fill: "#f472b6", stroke: "#ec4899", bg: "bg-pink-400/10", border: "border-pink-400/30", text: "text-pink-400" },
];

/**
 * Quick-Compare presets are modelName-based and auto-resolve at
 * runtime. If a model isn't in the dataset (e.g. retired or not yet
 * ingested), it's silently dropped from the preset.
 */
const PRESETS: { label: string; modelNames: string[] }[] = [
  { label: "Text Frontier", modelNames: ["GPT-5.5", "Claude Opus 4.7", "Gemini 3.1 Pro"] },
  { label: "Reasoning vs Chat", modelNames: ["GPT-5.5", "Claude Opus 4.6 Thinking", "GPT-o3"] },
  { label: "Image Models", modelNames: ["Midjourney V8", "Flux 2 Pro", "Imagen 4"] },
  { label: "Video Heavy Hitters", modelNames: ["Veo 3.1", "Kling 3.0", "Sora 2"] },
  { label: "Code Agents", modelNames: ["Claude Opus 4.7", "GPT-5.5", "Claude Opus 4.6"] },
  { label: "Open vs Closed (Text)", modelNames: ["Llama 3.1 405B", "Claude Opus 4.7", "DeepSeek V4 Pro Max"] },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function fmtNumber(n: number | null | undefined, digits = 3): string {
  if (n == null) return "—";
  if (n === 0) return "0";
  if (n < 0.001) return n.toExponential(2);
  if (n < 1) return n.toFixed(digits);
  if (n < 100) return n.toFixed(2);
  return n.toFixed(0);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s\-_/().,]+/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/*  Model selector dropdown                                            */
/* ------------------------------------------------------------------ */
function ModelSelector({
  slotIndex,
  selectedIds,
  allModels,
  onSelect,
}: {
  slotIndex: number;
  selectedIds: string[];
  allModels: DisplayModel[];
  onSelect: (model: DisplayModel) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allModels
      .filter((m) => !selectedIds.includes(m.id))
      .filter(
        (m) =>
          m.modelName.toLowerCase().includes(q) ||
          m.vendor.toLowerCase().includes(q) ||
          m.category.includes(q),
      )
      .slice(0, 80);
  }, [search, selectedIds, allModels]);

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
          Select model to compare…
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
            <div className="p-3 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models, vendors, categories…"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-teal/30"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-white/30">No models match.</div>
              ) : (
                filtered.map((model) => {
                  const catCfg = CATEGORY_DISPLAY[model.category];
                  const unit = ENERGY_UNIT_LABEL[model.energyUnit].short;
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
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${catCfg.bgClass} ${catCfg.textClass} uppercase font-medium tracking-wider`}>
                        {catCfg.label}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/90 truncate">{model.modelName}</p>
                        <p className="text-[11px] text-white/35 truncate">
                          {model.vendor}
                          {model.compositeRank ? ` · #${model.compositeRank}` : ""}
                          {model.parameters ? ` · ${model.parameters}` : ""}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-teal/60 shrink-0">
                        {fmtNumber(model.energyWh)} {unit}
                      </span>
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
/*  Selected model card                                                */
/* ------------------------------------------------------------------ */
function SelectedModelCard({
  model,
  slotIndex,
  onRemove,
}: {
  model: DisplayModel;
  slotIndex: number;
  onRemove: () => void;
}) {
  const color = SLOT_COLORS[slotIndex];
  const catCfg = CATEGORY_DISPLAY[model.category];
  const unit = ENERGY_UNIT_LABEL[model.energyUnit].short;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-xl border ${color.border} ${color.bg} p-4 relative group`}
    >
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/[0.06] hover:bg-red-500/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        aria-label="Remove model"
      >
        <X className="w-3 h-3 text-white/50 hover:text-red-400" />
      </button>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: color.fill }} />
        <div className="min-w-0">
          <h4 className="font-display font-semibold text-sm text-white truncate">{model.modelName}</h4>
          <p className="text-[11px] text-white/40 truncate">{model.vendor}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${catCfg.bgClass} ${catCfg.textClass} uppercase font-medium tracking-wider`}>
              {catCfg.label}
            </span>
            <ClassificationBadge classification={model.classification} />
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <Metric icon={<Zap className="w-3.5 h-3.5 text-amber-400" />} label="Energy" value={fmtNumber(model.energyWh)} unit={unit} accent="text-amber-300" />
        <Metric icon={<Flame className="w-3.5 h-3.5 text-rose-400" />} label="Carbon" value={fmtNumber(model.carbonGCO2e)} unit="gCO₂e" accent="text-rose-400" />
        <Metric icon={<Droplets className="w-3.5 h-3.5 text-blue-400" />} label="Water" value={fmtNumber(model.waterMl)} unit="mL" accent="text-blue-400" />
      </div>
    </motion.div>
  );
}

function Metric({
  icon, label, value, unit, accent,
}: {
  icon: React.ReactNode; label: string; value: string; unit: string; accent: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`font-mono text-sm font-semibold ${accent}`}>
        {value} <span className="text-[10px] text-white/30">{unit}</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chart tooltip                                                      */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1729] border border-white/[0.1] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill || p.color }} />
          <span className="text-xs text-white/70">{p.name}:</span>
          <span className="text-xs font-mono text-white font-semibold">{fmtNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                                */
/* ------------------------------------------------------------------ */
export default function ComparisonTool() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const dbQuery = trpc.cms.modelsForDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const allModels: DisplayModel[] = useMemo(() => {
    const dbRows = (dbQuery.data?.rows ?? []) as DbRow[];
    return dbRows.length > 0 ? dbRows.map(adaptDbRow) : ADAPTED_MODELS;
  }, [dbQuery.data]);

  const selectedModels = useMemo(
    () => selectedIds.map((id) => allModels.find((m) => m.id === id)).filter(Boolean) as DisplayModel[],
    [selectedIds, allModels],
  );

  const addModel = (model: DisplayModel) => {
    if (selectedIds.length >= MAX_COMPARE) return;
    if (!selectedIds.includes(model.id)) setSelectedIds((prev) => [...prev, model.id]);
  };

  const removeModel = (id: string) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const applyPreset = (modelNames: string[]) => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const name of modelNames) {
      if (ids.length >= MAX_COMPARE) break;
      const target = normalizeName(name);
      const match = allModels.find((m) => normalizeName(m.modelName) === target && !seen.has(m.id));
      if (match) {
        ids.push(match.id);
        seen.add(match.id);
      }
    }
    setSelectedIds(ids);
  };

  // Bar chart data — absolute values per metric.
  const barData = useMemo(() => {
    return [
      {
        metric: "Energy",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, m.energyWh ?? 0])),
      },
      {
        metric: "Carbon (g)",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, m.carbonGCO2e ?? 0])),
      },
      {
        metric: "Water (mL)",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, m.waterMl ?? 0])),
      },
    ];
  }, [selectedModels]);

  // Radar — normalize each axis 0-100 across selected models.
  const radarData = useMemo(() => {
    if (selectedModels.length < 2) return [];
    const maxOf = (key: "energyWh" | "carbonGCO2e" | "waterMl"): number =>
      Math.max(...selectedModels.map((m) => m[key] ?? 0), 0.001);
    const maxE = maxOf("energyWh");
    const maxC = maxOf("carbonGCO2e");
    const maxW = maxOf("waterMl");
    return [
      {
        metric: "Energy",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, Math.round(((m.energyWh ?? 0) / maxE) * 100)])),
      },
      {
        metric: "Carbon",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, Math.round(((m.carbonGCO2e ?? 0) / maxC) * 100)])),
      },
      {
        metric: "Water",
        ...Object.fromEntries(selectedModels.map((m, i) => [`model_${i}`, Math.round(((m.waterMl ?? 0) / maxW) * 100)])),
      },
      {
        metric: "Efficiency",
        ...Object.fromEntries(
          selectedModels.map((m, i) => [
            `model_${i}`,
            // Inverse of energy — lower energy = higher efficiency
            Math.round(((1 - (m.energyWh ?? 0) / maxE) * 80) + 20),
          ]),
        ),
      },
    ];
  }, [selectedModels]);

  // Headline insight (energy ratio between most + least energy-hungry).
  const insight = useMemo(() => {
    if (selectedModels.length < 2) return null;
    const withE = selectedModels.filter((m) => (m.energyWh ?? 0) > 0);
    if (withE.length < 2) return null;
    const sorted = [...withE].sort((a, b) => (a.energyWh ?? 0) - (b.energyWh ?? 0));
    const least = sorted[0];
    const most = sorted[sorted.length - 1];
    const ratio = (most.energyWh ?? 0) / (least.energyWh ?? 0.000001);
    // Cross-category warning
    const crossCat = least.category !== most.category;
    return {
      most, least, ratio,
      message: `${most.modelName} uses ${ratio.toFixed(1)}× more energy per inference than ${least.modelName}.`,
      crossCat,
    };
  }, [selectedModels]);

  // Cross-category warning — are we comparing apples to oranges?
  const unitsMixed = useMemo(() => {
    if (selectedModels.length < 2) return false;
    const units = new Set(selectedModels.map((m) => m.energyUnit));
    return units.size > 1;
  }, [selectedModels]);

  return (
    <section id="compare" ref={sectionRef} className="py-24 border-t border-white/[0.04]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
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
                Quick Compare
              </h2>
              <p className="text-sm text-white/40">
                Pick up to {MAX_COMPARE} models. Search the full {allModels.length}-model dataset or jump in with a preset.
              </p>
            </div>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[11px] text-white/30 uppercase tracking-wider self-center mr-1">Quick Compare:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => applyPreset(preset.modelNames)}
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] text-xs text-white/55 hover:text-teal hover:border-teal/20 hover:bg-teal/[0.04] transition-all"
              >
                {preset.label}
              </button>
            ))}
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
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

          {selectedIds.length < MAX_COMPARE && (
            <ModelSelector
              slotIndex={selectedIds.length}
              selectedIds={selectedIds}
              allModels={allModels}
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
            <p className="text-sm text-white/30 mb-2">No models selected yet.</p>
            <p className="text-xs text-white/20">
              Use the selector above or pick a preset to get started.
            </p>
          </motion.div>
        )}

        {/* Single — prompt to add another */}
        {selectedModels.length === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10 border border-dashed border-white/[0.08] rounded-2xl"
          >
            <ArrowRight className="w-8 h-8 text-teal/20 mx-auto mb-3" />
            <p className="text-sm text-white/40">Add at least one more model to start comparing.</p>
            <p className="text-xs text-white/20 mt-1">Charts + detailed metrics appear once you select 2+.</p>
          </motion.div>
        )}

        {/* Charts + table — when 2+ selected */}
        {selectedModels.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Cross-category warning */}
            {unitsMixed && (
              <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.04] flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/85 leading-relaxed">
                  Mixed energy units: the selected models span multiple categories
                  (text per-inference, image per-image, video per-second, code per-task).
                  The bar/radar charts compare raw Wh numbers — useful for sanity-checking
                  orders of magnitude, but not a like-for-like efficiency comparison.
                </p>
              </div>
            )}

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
                    Energy efficiency varies dramatically across architectures and task classes.
                    {insight.crossCat ? " These models are in different categories — see the cross-category note above." : " Smaller / task-specific models can be orders of magnitude more efficient."}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-teal/60" />
                  <h3 className="font-display font-semibold text-sm text-white">Absolute Metrics</h3>
                </div>
                <p className="text-[11px] text-white/30 mb-6">Raw values — energy (Wh), carbon (gCO₂e), water (mL).</p>
                <Legend models={selectedModels} />
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData} barGap={4} barCategoryGap="25%">
                    <XAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={{ stroke: "rgba(255,255,255,0.06)" }} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={56} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                    {selectedModels.map((m, i) => (
                      <Bar key={m.id} dataKey={`model_${i}`} name={m.modelName} fill={SLOT_COLORS[i].fill} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar chart */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="flex items-center gap-2 mb-1">
                  <GitCompareArrows className="w-4 h-4 text-teal/60" />
                  <h3 className="font-display font-semibold text-sm text-white">Normalized Profile</h3>
                </div>
                <p className="text-[11px] text-white/30 mb-6">Each metric scaled 0–100 across the selected models.</p>
                <Legend models={selectedModels} />
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    {selectedModels.map((m, i) => (
                      <Radar key={m.id} name={m.modelName} dataKey={`model_${i}`} stroke={SLOT_COLORS[i].stroke} fill={SLOT_COLORS[i].fill} fillOpacity={0.12} strokeWidth={2} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed metrics table */}
            <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h3 className="font-display font-semibold text-sm text-white">Detailed Metrics</h3>
                <p className="text-[11px] text-white/30 mt-0.5">Per-row units are labeled to keep cross-category comparisons honest.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="px-6 py-3 text-left text-[11px] text-white/40 uppercase tracking-wider font-medium">Metric</th>
                      {selectedModels.map((m, i) => (
                        <th key={m.id} className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-medium" style={{ color: SLOT_COLORS[i].fill }}>
                          {m.modelName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <TableRow
                      label="Energy / inference"
                      icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                      models={selectedModels}
                      pickValue={(m) => m.energyWh}
                      perRowUnit={(m) => ENERGY_UNIT_LABEL[m.energyUnit].short}
                      bestIsLowest
                    />
                    <TableRow
                      label="Carbon emissions"
                      icon={<Flame className="w-3.5 h-3.5 text-rose-400" />}
                      models={selectedModels}
                      pickValue={(m) => m.carbonGCO2e}
                      unit="gCO₂e"
                      bestIsLowest
                    />
                    <TableRow
                      label="Water usage"
                      icon={<Droplets className="w-3.5 h-3.5 text-blue-400" />}
                      models={selectedModels}
                      pickValue={(m) => m.waterMl}
                      unit="mL"
                      bestIsLowest
                    />

                    {/* Category */}
                    <tr className="border-b border-white/[0.04]">
                      <td className="px-6 py-3"><span className="text-xs text-white/60">Category</span></td>
                      {selectedModels.map((m) => {
                        const cfg = CATEGORY_DISPLAY[m.category];
                        return (
                          <td key={m.id} className="px-4 py-3 text-right">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.bgClass} ${cfg.textClass} uppercase font-medium tracking-wider`}>
                              {cfg.label}
                            </span>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Vendor */}
                    <tr className="border-b border-white/[0.04]">
                      <td className="px-6 py-3"><span className="text-xs text-white/60">Vendor</span></td>
                      {selectedModels.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-right font-mono text-xs text-white/55">{m.vendor}</td>
                      ))}
                    </tr>

                    {/* Parameters */}
                    <tr className="border-b border-white/[0.04]">
                      <td className="px-6 py-3"><span className="text-xs text-white/60">Parameters</span></td>
                      {selectedModels.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-right font-mono text-xs text-white/55">{m.parameters ?? "—"}</td>
                      ))}
                    </tr>

                    {/* Rank */}
                    <tr className="border-b border-white/[0.04]">
                      <td className="px-6 py-3"><span className="text-xs text-white/60">BenchLM Rank</span></td>
                      {selectedModels.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-right font-mono text-xs text-white/55">
                          {m.compositeRank ? `#${m.compositeRank}` : "—"}
                        </td>
                      ))}
                    </tr>

                    {/* Provenance */}
                    <tr className="border-b border-white/[0.04]">
                      <td className="px-6 py-3"><span className="text-xs text-white/60">Provenance</span></td>
                      {selectedModels.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-right">
                          <ClassificationBadge classification={m.classification} className="ml-auto" />
                        </td>
                      ))}
                    </tr>

                    {/* Methodology */}
                    <tr>
                      <td className="px-6 py-3"><span className="text-xs text-white/60">Methodology</span></td>
                      {selectedModels.map((m) => (
                        <td key={m.id} className="px-4 py-3 text-right font-mono text-[10px] text-white/40">
                          {m.methodologyVersion ?? "third-party"}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <p className="text-xs text-white/30">
                Values via the Mālama AICo2 Methodology for derived figures; third-party measurements for measured rows.{" "}
                <a href="#methodology" className="text-teal/60 hover:text-teal transition-colors underline underline-offset-2">View methodology</a>
                {" · "}
                <a href="#contribute" className="text-teal/60 hover:text-teal transition-colors underline underline-offset-2">Submit better data</a>
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

function Legend({ models }: { models: DisplayModel[] }) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {models.map((m, i) => (
        <div key={m.id} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SLOT_COLORS[i].fill }} />
          <span className="text-[11px] text-white/55 truncate max-w-[140px]">{m.modelName}</span>
        </div>
      ))}
    </div>
  );
}

function TableRow({
  label,
  icon,
  models,
  pickValue,
  unit,
  perRowUnit,
  bestIsLowest,
}: {
  label: string;
  icon: React.ReactNode;
  models: DisplayModel[];
  pickValue: (m: DisplayModel) => number | null;
  unit?: string;
  perRowUnit?: (m: DisplayModel) => string;
  bestIsLowest: boolean;
}) {
  const values = models.map(pickValue);
  const nonNull = values.filter((v): v is number => v != null && v > 0);
  const bestValue = nonNull.length > 1 ? (bestIsLowest ? Math.min(...nonNull) : Math.max(...nonNull)) : null;

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className="px-6 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs text-white/60">{label}</span>
        </div>
      </td>
      {models.map((m, i) => {
        const v = values[i];
        if (v == null) {
          return <td key={m.id} className="px-4 py-3 text-right"><span className="text-xs text-white/20 italic">No data</span></td>;
        }
        const isBest = bestValue != null && v === bestValue;
        const u = perRowUnit ? perRowUnit(m) : unit ?? "";
        return (
          <td key={m.id} className="px-4 py-3 text-right">
            <span className={`font-mono text-sm ${isBest ? "text-emerald-400" : "text-white/70"}`}>{fmtNumber(v)}</span>
            <span className="text-[10px] text-white/25 ml-1">{u}</span>
            {isBest && (
              <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">Best</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
