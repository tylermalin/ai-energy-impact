/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * DataExplorer: Interactive sortable/filterable data table with energy bars and category badges
 */
import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  AI_MODELS,
  MAX_ENERGY,
  CATEGORY_CONFIG,
  getEnergyLevel,
  ENERGY_COLORS,
  type Category,
  type AIModel,
} from "@/lib/data";

type SortKey = "id" | "category" | "task" | "model" | "energyMax" | "carbonMax" | "waterMax";
type SortDir = "asc" | "desc";

const FILTER_BUTTONS: { label: string; value: Category | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Text", value: "text" },
  { label: "Image", value: "image" },
  { label: "Video", value: "video" },
  { label: "Audio", value: "audio" },
  { label: "Other", value: "other" },
];

function EnergyBar({ value, max }: { value: number; max: number }) {
  if (value === 0) return <span className="text-xs text-white/30 font-data">N/A</span>;
  const pct = Math.max(2, (value / max) * 100);
  const level = getEnergyLevel(value);
  const colors = ENERGY_COLORS[level];

  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <div className="w-[70px] h-[5px] rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-data text-xs font-medium ${colors.text}`}>
        {value < 0.01 ? value.toFixed(4) : value < 1 ? value.toFixed(3) : value.toFixed(2)}
      </span>
    </div>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${config.bgClass} ${config.textClass}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}

function MetricPill({ value, type }: { value: string; type: "carbon" | "water" }) {
  if (value === "—") return <span className="text-[11px] text-white/25 font-data bg-white/[0.03] px-2 py-0.5 rounded">N/A</span>;
  const colorClass = type === "carbon" ? "text-rose-400 bg-rose-500/10" : "text-cyan-400 bg-cyan-500/10";
  return (
    <span className={`font-data text-[11px] font-medium px-2 py-0.5 rounded ${colorClass}`}>
      {value}
    </span>
  );
}

function SourceRefs({ source }: { source: string }) {
  const nums = source
    .split(/[,\s]+/)
    .flatMap((s) => {
      if (s.includes("-")) {
        const [a, b] = s.split("-").map(Number);
        return Array.from({ length: b - a + 1 }, (_, i) => a + i);
      }
      return [parseInt(s)];
    })
    .filter((n) => !isNaN(n));

  return (
    <div className="flex gap-1 flex-wrap">
      {nums.map((n) => (
        <span key={n} className="w-5 h-5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          {n}
        </span>
      ))}
    </div>
  );
}

export default function DataExplorer() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Category | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let data = [...AI_MODELS];

    if (filter !== "all") {
      data = data.filter((m) => m.category === filter);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (m) =>
          m.task.toLowerCase().includes(q) ||
          m.model.toLowerCase().includes(q) ||
          m.size.toLowerCase().includes(q) ||
          m.utility.toLowerCase().includes(q)
      );
    }

    data.sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case "id": va = a.id; vb = b.id; break;
        case "category": va = a.category; vb = b.category; break;
        case "task": va = a.task; vb = b.task; break;
        case "model": va = a.model; vb = b.model; break;
        case "energyMax": va = a.energyMax; vb = b.energyMax; break;
        case "carbonMax": va = a.carbonMax; vb = b.carbonMax; break;
        case "waterMax": va = a.waterMax; vb = b.waterMax; break;
        default: va = a.id; vb = b.id;
      }
      if (typeof va === "string") {
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortDir === "asc" ? va - vb : vb - va;
    });

    return data;
  }, [search, filter, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-teal" /> : <ArrowDown className="w-3 h-3 text-teal" />;
  };

  return (
    <section id="explorer" className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-3">
            Data Explorer
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Sort, filter, and search across all 30 AI models. Energy values are per-prompt. Click column headers to sort.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models, tasks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-white/30 focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/20 transition-all font-body"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {FILTER_BUTTONS.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                  filter === btn.value
                    ? "bg-teal/15 border-teal/30 text-teal"
                    : "bg-white/[0.03] border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden shadow-2xl shadow-black/20"
        >
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-teal/20 scrollbar-track-transparent">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {[
                    { key: "id" as SortKey, label: "#", width: "w-12" },
                    { key: "category" as SortKey, label: "Category", width: "w-24" },
                    { key: "task" as SortKey, label: "AI Task", width: "w-44" },
                    { key: "model" as SortKey, label: "Model", width: "w-48" },
                    { key: "energyMax" as SortKey, label: "Energy (Wh/prompt)", width: "w-44" },
                    { key: "carbonMax" as SortKey, label: "Carbon (gCO\u2082e)", width: "w-28" },
                    { key: "waterMax" as SortKey, label: "Water (mL)", width: "w-24" },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={`${col.width} px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]`}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        <SortIcon col={col.key} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 bg-teal/[0.03] w-44">
                    Utility / Score
                  </th>
                  <th className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 bg-teal/[0.03] w-20">
                    Src
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-4 py-3 text-xs text-white/30 font-data font-medium">{row.id}</td>
                    <td className="px-4 py-3"><CategoryBadge category={row.category} /></td>
                    <td className="px-4 py-3 text-xs text-white/60 max-w-[180px]">{row.task}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-sm text-white group-hover:text-teal transition-colors">{row.model}</div>
                      <div className="text-[11px] text-white/30 mt-0.5 font-data">{row.size}</div>
                    </td>
                    <td className="px-4 py-3">
                      <EnergyBar value={row.energyMax} max={MAX_ENERGY} />
                    </td>
                    <td className="px-4 py-3"><MetricPill value={row.carbon} type="carbon" /></td>
                    <td className="px-4 py-3"><MetricPill value={row.water} type="water" /></td>
                    <td className="px-4 py-3 text-xs text-white/50 max-w-[180px] leading-relaxed">{row.utility}</td>
                    <td className="px-4 py-3"><SourceRefs source={row.source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-5 py-3 border-t border-white/[0.06] text-xs text-white/30">
            <span className="font-data font-medium">
              Showing {filtered.length} of {AI_MODELS.length} models
            </span>
            <span>Data compiled from multiple research sources</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
