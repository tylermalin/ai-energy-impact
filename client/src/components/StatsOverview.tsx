/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Stats: Category breakdown cards with mini bar charts and energy distribution
 */
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { ENERGY_BY_CATEGORY, CATEGORY_CONFIG, AI_MODELS, type Category } from "@/lib/data";

const ENERGY_VIZ = "https://d2xsxph8kpxj0f.cloudfront.net/310419663031887970/RntCY6FmRCfuLPXHtAP4Lb/energy-viz-STSDC5Ha3UjbkSDvrrDHkr.webp";

const pieData = Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
  name: config.label,
  value: AI_MODELS.filter((m) => m.category === key).length,
  color: config.color,
}));

const topConsumers = [...AI_MODELS]
  .sort((a, b) => b.energyMax - a.energyMax)
  .slice(0, 8)
  .map((m) => ({
    name: m.model.length > 18 ? m.model.slice(0, 18) + "..." : m.model,
    energy: m.energyMax,
    color: CATEGORY_CONFIG[m.category].color,
  }));

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0f1629] border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-white/60 mb-1">{label || payload[0]?.name}</p>
      <p className="text-sm font-data text-teal font-semibold">
        {payload[0]?.value?.toFixed(2)} Wh
      </p>
    </div>
  );
}

export default function StatsOverview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="insights" className="py-20 relative" ref={ref}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight mb-3">
            Impact Overview
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Energy consumption varies by orders of magnitude across AI task categories. Video generation dominates resource usage, while text classification remains remarkably efficient.
          </p>
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
            <p className="text-xs text-white/40 mb-6">Max Wh per prompt (log scale)</p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topConsumers} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                  <XAxis
                    type="number"
                    scale="log"
                    domain={[0.01, 1000]}
                    tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                    axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "'IBM Plex Sans', sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="energy" radius={[0, 4, 4, 0]} barSize={20}>
                    {topConsumers.map((entry, index) => (
                      <Cell key={index} fill={entry.color} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
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
              <h3 className="font-display font-semibold text-sm text-white/80 uppercase tracking-wider mb-4">
                Model Distribution
              </h3>
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
                <p className="text-xs text-white/70 font-medium">Energy flows across AI model categories</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
