/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * DataExplorer (Phase 1): Category-aware tabs, provenance badges,
 * freshness dots, row-expand details, per-tab energy unit headers,
 * and filters for classification / task class / freshness.
 *
 * Reads from ADAPTED_MODELS (legacy 30 rows transformed into the new
 * DisplayModel shape) so the UI works in dev without a DB or Sanity
 * connection. When the tRPC cms.models query returns real Sanity rows
 * those will replace this source in a follow-up wiring step.
 */

import { useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import {
  ADAPTED_MODELS,
  CATEGORY_DISPLAY,
  ENERGY_UNIT_LABEL,
  type DisplayCategory,
  type DisplayModel,
} from "@/lib/modelsAdapter";
import { adaptDbRow, type DbRow } from "@/lib/dbModelsAdapter";
import { trpc } from "@/lib/trpc";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CodeTabBanner } from "@/components/CodeTabBanner";
import { ClassificationBadge, FreshnessDot } from "@/components/ProvenanceBadges";
import { RowExpand } from "@/components/RowExpand";
import { computeStalenessLevel, type StalenessLevel } from "../../../shared/lib/staleness";
import type { Classification } from "../../../shared/lib/provenance";

type SortKey =
  | "compositeRank"
  | "modelName"
  | "vendor"
  | "energyForSort"
  | "carbonGCO2e"
  | "waterMl";
type SortDir = "asc" | "desc";

type ClassificationFilter = Classification | "all";
type StalenessFilter = StalenessLevel | "all";

const ALL_CLASSIFICATIONS: ClassificationFilter[] = [
  "all",
  "measured",
  "derived",
  "estimated",
];
const ALL_STALENESS: StalenessFilter[] = ["all", "fresh", "aging", "stale", "unverified"];

function getEnergyLevel(val: number): "low" | "med" | "high" | "extreme" {
  if (val <= 0.5) return "low";
  if (val <= 5) return "med";
  if (val <= 40) return "high";
  return "extreme";
}

const ENERGY_COLORS = {
  low: { bar: "from-emerald-400 to-emerald-300", text: "text-emerald-400" },
  med: { bar: "from-amber-400 to-amber-300", text: "text-amber-400" },
  high: { bar: "from-rose-500 to-rose-400", text: "text-rose-400" },
  extreme: { bar: "from-red-600 to-red-500", text: "text-red-500" },
};

function EnergyBar({
  value,
  max,
  rangeRaw,
}: {
  value: number | null;
  max: number;
  rangeRaw: string | null;
}) {
  if (value === null || value === 0) {
    return <span className="text-xs text-white/25 font-data">—</span>;
  }
  const pct = Math.max(2, (value / max) * 100);
  const level = getEnergyLevel(value);
  const colors = ENERGY_COLORS[level];

  return (
    <div className="flex items-center gap-2.5 min-w-[140px]">
      <div className="w-[70px] h-[5px] rounded-full bg-white/[0.06] overflow-hidden flex-shrink-0">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`font-data text-xs font-medium ${colors.text}`} title={rangeRaw ?? undefined}>
        {value < 0.01 ? value.toFixed(4) : value < 1 ? value.toFixed(3) : value.toFixed(2)}
      </span>
    </div>
  );
}

function MetricPill({
  value,
  type,
}: {
  value: number | null;
  type: "carbon" | "water";
}) {
  if (value === null) {
    return (
      <span className="text-[11px] text-white/25 font-data bg-white/[0.03] px-2 py-0.5 rounded">
        N/A
      </span>
    );
  }
  const colorClass =
    type === "carbon" ? "text-rose-400 bg-rose-500/10" : "text-cyan-400 bg-cyan-500/10";
  return (
    <span className={`font-data text-[11px] font-medium px-2 py-0.5 rounded ${colorClass}`}>
      {value < 0.01 ? value.toFixed(4) : value < 1 ? value.toFixed(3) : value.toFixed(2)}
    </span>
  );
}

export default function DataExplorer() {
  const [activeCategory, setActiveCategory] = useState<DisplayCategory>("text");
  const [showAllInCategory, setShowAllInCategory] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [search, setSearch] = useState("");
  const [classificationFilter, setClassificationFilter] = useState<ClassificationFilter>("all");
  const [stalenessFilter, setStalenessFilter] = useState<StalenessFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("compositeRank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  // Read from MySQL via tRPC. Falls back to ADAPTED_MODELS (legacy 30
  // hardcoded rows) when the query is loading, errors, or returns empty.
  const dbQuery = trpc.cms.modelsForDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const { models, source, totalRowCount, dedupedRowCount } = useMemo(() => {
    const dbRows = (dbQuery.data?.rows ?? []) as DbRow[];
    if (dbRows.length > 0) {
      return {
        models: dbRows.map(adaptDbRow),
        source: "db" as const,
        totalRowCount: dbQuery.data?.totalRowCount ?? 0,
        dedupedRowCount: dbQuery.data?.dedupedRowCount ?? 0,
      };
    }
    return {
      models: ADAPTED_MODELS,
      source: "fallback" as const,
      totalRowCount: ADAPTED_MODELS.length,
      dedupedRowCount: ADAPTED_MODELS.length,
    };
  }, [dbQuery.data]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Per-category counts for the tab bar.
  const countsByCategory = useMemo(() => {
    const counts: Partial<Record<DisplayCategory, number>> = {};
    for (const m of models) {
      counts[m.category] = (counts[m.category] ?? 0) + 1;
    }
    return counts;
  }, [models]);

  // Audio + Other are surfaced under "Additional Models", not in tabs.
  const additionalModels = useMemo(
    () => models.filter((m) => m.category === "audio" || m.category === "other"),
    [models],
  );

  // Are there any Top-20 rows in the active category? Drives the default
  // visibility of the long tail. In dev (no seed run yet) this is false
  // for all categories so the dashboard stays useful.
  const hasTop20InCategory = useMemo(
    () => models.some((m) => m.category === activeCategory && m.inTop20),
    [models, activeCategory],
  );

  const filtered = useMemo(() => {
    let data = models.filter((m) => m.category === activeCategory);

    // If there are real Top-20 rows and the user hasn't toggled "show all",
    // restrict the table to those rows.
    if (hasTop20InCategory && !showAllInCategory) {
      data = data.filter((m) => m.inTop20);
    }

    if (classificationFilter !== "all") {
      data = data.filter((m) => m.classification === classificationFilter);
    }

    if (stalenessFilter !== "all") {
      data = data.filter((m) => computeStalenessLevel(m.lastVerifiedAt) === stalenessFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (m) =>
          m.modelName.toLowerCase().includes(q) ||
          m.modelFamily.toLowerCase().includes(q) ||
          m.vendor.toLowerCase().includes(q) ||
          (m.utilityScore ?? "").toLowerCase().includes(q) ||
          (m.parameters ?? "").toLowerCase().includes(q),
      );
    }

    data.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      const an = typeof va === "number" ? va : null;
      const bn = typeof vb === "number" ? vb : null;
      const as = typeof va === "string" ? va : null;
      const bs = typeof vb === "string" ? vb : null;

      // Nulls sort last regardless of direction.
      if (an === null && bn !== null) return 1;
      if (an !== null && bn === null) return -1;

      if (an !== null && bn !== null) {
        return sortDir === "asc" ? an - bn : bn - an;
      }
      if (as !== null && bs !== null) {
        return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
      }
      return 0;
    });

    return data;
  }, [
    models,
    activeCategory,
    hasTop20InCategory,
    showAllInCategory,
    classificationFilter,
    stalenessFilter,
    search,
    sortKey,
    sortDir,
  ]);

  const totalInCategory = useMemo(
    () => models.filter((m) => m.category === activeCategory).length,
    [models, activeCategory],
  );

  const maxEnergyInCategory = useMemo(() => {
    const ms = models.filter((m) => m.category === activeCategory);
    return Math.max(1, ...ms.map((m) => m.energyForSort));
  }, [models, activeCategory]);

  const energyUnit = useMemo(() => {
    const sample = models.find((m) => m.category === activeCategory);
    return sample?.energyUnit ?? "wh_per_inference";
  }, [models, activeCategory]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-teal" />
    ) : (
      <ArrowDown className="w-3 h-3 text-teal" />
    );
  };

  const energyHeaderLabel = ENERGY_UNIT_LABEL[energyUnit].short;
  const energyHeaderTooltip = ENERGY_UNIT_LABEL[energyUnit].tooltip;

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
          <p className="text-muted-foreground max-w-2xl mb-3">
            Sort, filter, and search across AI models by category. Each row carries provenance
            (classification, source, freshness). Click a row to expand measurement conditions.
          </p>
          <p className="text-sm text-white/45 max-w-3xl leading-relaxed border-l-2 border-teal/30 pl-4">
            <span className="text-white/60 font-medium">Note:</span> This dashboard tracks{" "}
            <span className="text-white/70">per-inference</span> energy. Training a frontier model can
            consume thousands of megawatt-hours before a single user prompt is served. Total AI
            footprint is the sum of training, fine-tuning, idle capacity, and inference. We focus on
            inference because it is the metric most directly tied to end-user activity, but readers
            should treat it as one component of a larger system. See{" "}
            <a href="#methodology" className="text-teal/80 hover:text-teal underline underline-offset-2">
              methodology
            </a>{" "}
            for full details.
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <CategoryTabs
            active={activeCategory}
            onChange={(c) => {
              setActiveCategory(c);
              setExpandedId(null);
              setShowAllInCategory(false);
            }}
            countsByCategory={countsByCategory}
          />
        </motion.div>

        {/* Code-tab banner */}
        {activeCategory === "code" ? <CodeTabBanner /> : null}

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-3 mb-6 lg:items-center"
        >
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models, vendors, parameters..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-foreground placeholder:text-white/30 focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/20 transition-all font-body"
            />
          </div>

          {/* Classification filter */}
          <select
            value={classificationFilter}
            onChange={(e) => setClassificationFilter(e.target.value as ClassificationFilter)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/70 focus:outline-none focus:border-teal/40 capitalize"
            aria-label="Filter by classification"
          >
            {ALL_CLASSIFICATIONS.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All classifications" : c}
              </option>
            ))}
          </select>

          {/* Freshness filter */}
          <select
            value={stalenessFilter}
            onChange={(e) => setStalenessFilter(e.target.value as StalenessFilter)}
            className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-white/70 focus:outline-none focus:border-teal/40 capitalize"
            aria-label="Filter by freshness"
          >
            {ALL_STALENESS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All freshness" : s}
              </option>
            ))}
          </select>

          {/* Long-tail toggle (only when there's a Top-20 to hide behind) */}
          {hasTop20InCategory ? (
            <label className="inline-flex items-center gap-2 text-xs font-medium text-white/55 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showAllInCategory}
                onChange={(e) => setShowAllInCategory(e.target.checked)}
                className="w-3.5 h-3.5 accent-teal"
              />
              Show full long tail
            </label>
          ) : null}
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
                  <th className="w-10 px-3 py-3.5 bg-teal/[0.03]" aria-label="Expand row" />
                  <th
                    onClick={() => handleSort("compositeRank")}
                    className="w-14 px-3 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]"
                  >
                    <div className="flex items-center gap-1.5">
                      Rank
                      <SortIcon col="compositeRank" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("modelName")}
                    className="px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]"
                  >
                    <div className="flex items-center gap-1.5">
                      Model
                      <SortIcon col="modelName" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("vendor")}
                    className="w-32 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]"
                  >
                    <div className="flex items-center gap-1.5">
                      Vendor
                      <SortIcon col="vendor" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("energyForSort")}
                    className="w-44 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]"
                    title={energyHeaderTooltip}
                  >
                    <div className="flex items-center gap-1.5">
                      {energyHeaderLabel}
                      <SortIcon col="energyForSort" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("carbonGCO2e")}
                    className="w-28 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]"
                  >
                    <div className="flex items-center gap-1.5">
                      Carbon (gCO₂e)
                      <SortIcon col="carbonGCO2e" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("waterMl")}
                    className="w-24 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 hover:text-teal cursor-pointer select-none transition-colors bg-teal/[0.03]"
                  >
                    <div className="flex items-center gap-1.5">
                      Water (mL)
                      <SortIcon col="waterMl" />
                    </div>
                  </th>
                  <th className="w-28 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 bg-teal/[0.03]">
                    Class.
                  </th>
                  <th className="w-28 px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 bg-teal/[0.03]">
                    Freshness
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-6 py-12 text-center text-sm text-white/40"
                    >
                      No models match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const isExpanded = expandedId === row.id;
                    return (
                      <ExpandableRow
                        key={row.id}
                        row={row}
                        maxEnergyInCategory={maxEnergyInCategory}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedId(isExpanded ? null : row.id)}
                      />
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap justify-between items-center gap-2 px-5 py-3 border-t border-white/[0.06] text-xs text-white/30">
            <span className="font-data font-medium">
              Showing {filtered.length} of {totalInCategory} {CATEGORY_DISPLAY[activeCategory].label}{" "}
              models
            </span>
            <span className="flex items-center gap-3">
              <span>
                {hasTop20InCategory
                  ? showAllInCategory
                    ? "Long tail visible"
                    : "Top 20 view"
                  : "Long tail (no Top-20 seeded yet)"}
              </span>
              <span className="text-white/20">·</span>
              <span title={source === "db" ? `MySQL — ${dedupedRowCount} deduped from ${totalRowCount} raw measurements` : "Static fallback (DB unavailable)"}>
                {source === "db" ? `DB · ${dedupedRowCount} deduped` : "Static fallback"}
              </span>
            </span>
          </div>
        </motion.div>

        {/* Additional Models (audio + other) */}
        {additionalModels.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-10"
          >
            <button
              onClick={() => setShowAdditional((v) => !v)}
              className="inline-flex items-center gap-2 text-xs font-display font-semibold text-white/55 hover:text-white/80 uppercase tracking-wider"
            >
              {showAdditional ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              Additional Models — Audio &amp; Other
              <span className="text-[11px] font-data text-white/35 normal-case tracking-normal">
                ({additionalModels.length})
              </span>
            </button>
            {showAdditional ? (
              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70 bg-teal/[0.03]">
                      <th className="px-4 py-3 text-left">Model</th>
                      <th className="px-4 py-3 text-left w-32">Category</th>
                      <th className="px-4 py-3 text-left w-32">Vendor</th>
                      <th className="px-4 py-3 text-left w-40">Energy</th>
                      <th className="px-4 py-3 text-left w-28">Class.</th>
                      <th className="px-4 py-3 text-left w-28">Freshness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalModels.map((row) => (
                      <tr key={row.id} className="border-b border-white/[0.04]">
                        <td className="px-4 py-3 text-sm text-white">{row.modelName}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              CATEGORY_DISPLAY[row.category].bgClass
                            } ${CATEGORY_DISPLAY[row.category].textClass}`}
                          >
                            {CATEGORY_DISPLAY[row.category].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/55 font-data">{row.vendor}</td>
                        <td className="px-4 py-3">
                          <EnergyBar
                            value={row.energyForSort || null}
                            max={Math.max(1, ...additionalModels.map((m) => m.energyForSort))}
                            rangeRaw={row.energyRangeRaw}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <ClassificationBadge classification={row.classification} />
                        </td>
                        <td className="px-4 py-3">
                          <FreshnessDot lastVerifiedAt={row.lastVerifiedAt} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

function ExpandableRow({
  row,
  maxEnergyInCategory,
  isExpanded,
  onToggle,
}: {
  row: DisplayModel;
  maxEnergyInCategory: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors group cursor-pointer"
        aria-expanded={isExpanded}
      >
        <td className="px-3 py-3 text-white/40">
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </td>
        <td className="px-3 py-3 text-xs text-white/40 font-data font-medium">
          {row.compositeRank ? `#${row.compositeRank}` : "—"}
        </td>
        <td className="px-4 py-3">
          <div className="font-semibold text-sm text-white group-hover:text-teal transition-colors">
            {row.modelName}
          </div>
          <div className="text-[11px] text-white/30 mt-0.5 font-data">
            {row.parameters ?? row.modelFamily}
            {row.openWeight ? <span className="ml-2 text-emerald-400/60">open</span> : null}
            {row.statusNote ? (
              <span className="ml-2 text-amber-300/70">{row.statusNote}</span>
            ) : null}
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-white/55 font-data">{row.vendor}</td>
        <td className="px-4 py-3">
          <EnergyBar
            value={row.energyForSort || null}
            max={maxEnergyInCategory}
            rangeRaw={row.energyRangeRaw}
          />
        </td>
        <td className="px-4 py-3">
          <MetricPill value={row.carbonGCO2e} type="carbon" />
        </td>
        <td className="px-4 py-3">
          <MetricPill value={row.waterMl} type="water" />
        </td>
        <td className="px-4 py-3">
          <ClassificationBadge classification={row.classification} />
        </td>
        <td className="px-4 py-3">
          <FreshnessDot lastVerifiedAt={row.lastVerifiedAt} />
        </td>
      </tr>
      {isExpanded ? (
        <tr>
          <td colSpan={9} className="p-0">
            <RowExpand model={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
