/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Stats (Phase 3b+): reads from MySQL via cms.modelsForDashboard,
 * falling back to ADAPTED_MODELS when the DB query is loading/empty.
 *
 * Top Energy Consumers + Model Distribution now reflect the live Top 20
 * lists across text/image/video/code (plus audio + other in distribution).
 */
import { motion, useInView } from "framer-motion";
import { useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { trpc } from "@/lib/trpc";
import { adaptDbRow, type DbRow } from "@/lib/dbModelsAdapter";
import { ADAPTED_MODELS, CATEGORY_DISPLAY, ENERGY_UNIT_LABEL, type DisplayCategory, type DisplayModel } from "@/lib/modelsAdapter";

const ENERGY_VIZ = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/energy-viz-STSDC5Ha3UjbkSDvrrDHkr.webp";

interface TopConsumer {
  name: string;
  energy: number;
  color: string;
  unit: string;
  category: DisplayCategory;
  classification: string;
  vendor: string;
}

interface PieSlice {
  name: string;
  value: number;
  color: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TopConsumer | undefined;
  if (!d) return null;
  return (
    <div className="bg-[#0f1629] border border-white/10 rounded-lg px-3 py-2 shadow-xl space-y-0.5">
      <p className="text-xs text-white/60">{d.name}</p>
      <p className="text-sm font-data text-teal font-semibold">
        {d.energy < 1 ? d.energy.toFixed(3) : d.energy.toFixed(1)} {d.unit}
      </p>
      <p className="text-[10px] text-white/40 uppercase tracking-wider">
        {d.vendor} · {d.classification}
      </p>
    </div>
  );
}

export default function StatsOverview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const dbQuery = trpc.cms.modelsForDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const { models, sourceLabel } = useMemo(() => {
    const dbRows = (dbQuery.data?.rows ?? []) as DbRow[];
    if (dbRows.length > 0) {
      return {
        models: dbRows.map(adaptDbRow),
        sourceLabel: `DB · ${dbQuery.data?.dedupedRowCount ?? dbRows.length} models`,
      };
    }
    return { models: ADAPTED_MODELS, sourceLabel: `Static fallback · ${ADAPTED_MODELS.length} models` };
  }, [dbQuery.data]);

  // Top Energy Consumers — representative mix across the four primary
  // categories so the log-scale bars span their real range. Picking the
  // raw top-8-by-energy yields 8 identical video bars (the AICo2
  // estimator currently uses one reference Wh per video model), which
  // renders as 8 max-width bars and looks broken. Instead we take the
  // top 2 from each of text/image/video/code, then dedupe by energy
  // value to avoid showing identical-value bars.
  const topConsumers: TopConsumer[] = useMemo(() => {
    const withEnergy = models.filter((m) => m.energyForSort > 0);
    const picked: typeof withEnergy = [];
    const seenEnergyKey = new Set<string>();

    for (const cat of ["video", "image", "code", "text"] as DisplayCategory[]) {
      const inCat = withEnergy
        .filter((m) => m.category === cat)
        .sort((a, b) => b.energyForSort - a.energyForSort);
      let countForCat = 0;
      for (const m of inCat) {
        // Dedupe identical-energy rows (rounded to 3 sig figs) within a category.
        const key = `${m.category}:${m.energyForSort.toPrecision(3)}`;
        if (seenEnergyKey.has(key)) continue;
        seenEnergyKey.add(key);
        picked.push(m);
        countForCat++;
        if (countForCat >= 2) break;
      }
    }

    // If a category contributed nothing, top up with whatever has the most energy.
    if (picked.length < 8) {
      const fillers = [...withEnergy]
        .filter((m) => !picked.includes(m))
        .sort((a, b) => b.energyForSort - a.energyForSort);
      for (const m of fillers) {
        if (picked.length >= 8) break;
        picked.push(m);
      }
    }

    return picked
      .sort((a, b) => b.energyForSort - a.energyForSort)
      .slice(0, 8)
      .map((m) => ({
        name: m.modelName.length > 22 ? m.modelName.slice(0, 22) + "…" : m.modelName,
        energy: m.energyForSort,
        color: CATEGORY_DISPLAY[m.category].color,
        unit: ENERGY_UNIT_LABEL[m.energyUnit].short,
        category: m.category,
        classification: m.classification,
        vendor: m.vendor,
      }));
  }, [models]);

  // Model Distribution — every category with at least 1 row.
  const pieData: PieSlice[] = useMemo(() => {
    const counts = new Map<DisplayCategory, number>();
    for (const m of models) {
      counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    }
    const slices: PieSlice[] = [];
    for (const cat of ["text", "image", "video", "code", "audio", "other"] as DisplayCategory[]) {
      const v = counts.get(cat) ?? 0;
      if (v > 0) {
        slices.push({ name: CATEGORY_DISPLAY[cat].label, value: v, color: CATEGORY_DISPLAY[cat].color });
      }
    }
    return slices;
  }, [models]);

  // Pull a few headline stats for the strap above the charts.
  const headlineStats = useMemo(() => {
    const measured = models.filter((m) => m.classification === "measured").length;
    const derived = models.filter((m) => m.classification === "derived").length;
    const estimated = models.filter((m) => m.classification === "estimated").length;
    const maxEnergyRow = topConsumers[0];
    return {
      total: models.length,
      measured,
      derived,
      estimated,
      maxEnergyModel: maxEnergyRow?.name ?? "—",
      maxEnergy: maxEnergyRow?.energy ?? 0,
      maxEnergyUnit: maxEnergyRow?.unit ?? "Wh",
    };
  }, [models, topConsumers]);

  return (
    <section id="insights" className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-3">
                Impact Overview
              </h2>
              <p className="text-muted-foreground max-w-2xl">
                Per-inference energy across {headlineStats.total} models. Values span six orders of magnitude — video generation dominates, classification stays remarkably efficient.
              </p>
            </div>
            <span className="text-[10px] text-white/30 font-data uppercase tracking-wider">{sourceLabel}</span>
          </div>

          {/* Provenance strap */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-[11px] text-white/45">
            <span><span className="text-emerald-300 font-data">{headlineStats.measured}</span> measured</span>
            <span><span className="text-amber-300 font-data">{headlineStats.derived}</span> derived</span>
            <span><span className="text-white/55 font-data">{headlineStats.estimated}</span> estimated (Mālama AICo2)</span>
          </div>
        </motion.div>

        {/* Grid: Charts + Image */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Energy Consumers Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 glow-border"
          >
            <h3 className="font-display font-semibold text-sm text-white/80 uppercase tracking-wider mb-1">
              Top Energy Consumers
            </h3>
            <p className="text-xs text-white/40 mb-1">Highest per-inference energy across all categories (log scale).</p>
            <p className="text-[10px] text-white/30 mb-5">
              Units differ per category — hover for the exact unit per row.
            </p>
            <div className="h-[320px]">
              {topConsumers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-white/30">
                  {dbQuery.isLoading ? "Loading…" : "No models with energy data yet."}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topConsumers} layout="vertical" margin={{ left: 10, right: 32, top: 0, bottom: 0 }}>
                    <XAxis
                      type="number"
                      scale="log"
                      // Pad both ends so the smallest bar isn't a sliver and
                      // the largest bar doesn't kiss the axis line.
                      domain={[
                        (dataMin: number) => Math.max(0.0001, dataMin * 0.3),
                        (dataMax: number) => dataMax * 3,
                      ]}
                      allowDataOverflow={false}
                      ticks={[0.001, 0.01, 0.1, 1, 10, 100, 1000]}
                      tickFormatter={(v: number) => {
                        if (v >= 1000) return `${v / 1000}k`;
                        if (v >= 1) return String(v);
                        return v.toString();
                      }}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={160}
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="energy" radius={[0, 4, 4, 0]} barSize={20}>
                      {topConsumers.map((entry, i) => (
                        <Cell key={i} fill={entry.color} fillOpacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Right column: Pie + Energy image */}
          <div className="flex flex-col gap-6">
            {/* Category Distribution Pie */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 glow-border"
            >
              <h3 className="font-display font-semibold text-sm text-white/80 uppercase tracking-wider mb-1">
                Model Distribution
              </h3>
              <p className="text-xs text-white/40 mb-4">{headlineStats.total} models across six categories</p>
              <div className="h-[180px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-[#0f1629] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
                            <p className="text-xs text-white/60">{payload[0]?.name}</p>
                            <p className="text-sm font-data text-teal font-semibold">{payload[0]?.value} models</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[11px] text-white/50">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Energy Visualization Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="rounded-xl border border-white/[0.06] overflow-hidden glow-border flex-1 min-h-[160px] relative group"
            >
              <img
                src={ENERGY_VIZ}
                alt="Energy consumption visualization"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-xs text-white/70 font-medium">
                  Headline: {headlineStats.maxEnergyModel} —{" "}
                  {headlineStats.maxEnergy < 1 ? headlineStats.maxEnergy.toFixed(3) : headlineStats.maxEnergy.toFixed(0)}{" "}
                  {headlineStats.maxEnergyUnit}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// keep DisplayModel imported for type tracking (even if unused in JSX directly)
void (null as unknown as DisplayModel | null);
