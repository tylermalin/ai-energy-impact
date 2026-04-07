/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Malama Sensors Demo: Simulated real-time data center monitoring dashboard
 * Features live-updating sensor readings, animated charts, zone map, and CTA.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import {
  Zap, Thermometer, Droplets, Wind, Activity, Cpu, Server,
  ArrowLeft, Shield, Radio, TrendingDown, AlertTriangle,
  CheckCircle, Clock, BarChart3, Waves, ExternalLink, FileDown
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from "recharts";
import { AICO2_METHODOLOGY_URL } from "@/lib/data";

/* ─── Simulated Sensor Data Generator ─── */
function jitter(base: number, range: number) {
  return +(base + (Math.random() - 0.5) * range).toFixed(2);
}

function generateReading() {
  return {
    time: new Date().toLocaleTimeString("en-US", { hour12: false }),
    power: jitter(342, 40),
    pue: jitter(1.12, 0.06),
    temp: jitter(22.4, 3),
    humidity: jitter(45, 8),
    waterFlow: jitter(18.6, 4),
    co2Rate: jitter(137, 20),
    gpuUtil: jitter(78, 15),
    cpuUtil: jitter(42, 12),
  };
}

function generateHistory(count: number) {
  const data = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * 5000);
    data.push({
      time: t.toLocaleTimeString("en-US", { hour12: false }),
      power: jitter(342, 40),
      pue: jitter(1.12, 0.06),
      temp: jitter(22.4, 3),
      waterFlow: jitter(18.6, 4),
      co2Rate: jitter(137, 20),
    });
  }
  return data;
}

/* ─── Zone Data ─── */
const ZONES = [
  { id: "A1", name: "GPU Cluster Alpha", racks: 24, temp: 23.1, power: 148, status: "optimal" as const },
  { id: "A2", name: "GPU Cluster Beta", racks: 18, temp: 24.8, power: 112, status: "optimal" as const },
  { id: "B1", name: "Storage Array", racks: 12, temp: 21.2, power: 42, status: "optimal" as const },
  { id: "B2", name: "Network Core", racks: 6, temp: 20.8, power: 28, status: "optimal" as const },
  { id: "C1", name: "Cooling Plant", racks: 0, temp: 18.4, power: 38, status: "optimal" as const },
  { id: "C2", name: "Inference Edge", racks: 8, temp: 26.1, power: 67, status: "warning" as const },
];

/* ─── Metric Card ─── */
function MetricCard({ icon: Icon, label, value, unit, trend, color, pulse }: {
  icon: React.ElementType; label: string; value: string; unit: string;
  trend?: string; color: string; pulse?: boolean;
}) {
  return (
    <div className="relative group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.12] transition-all duration-300">
      {pulse && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-teal animate-pulse" />
      )}
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend && (
          <span className="text-[10px] font-mono text-teal/70 bg-teal/10 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      <div className="font-mono text-2xl font-bold text-white tracking-tight">
        {value}
        <span className="text-sm font-normal text-white/40 ml-1">{unit}</span>
      </div>
      <div className="text-[11px] text-white/40 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

/* ─── Zone Card ─── */
function ZoneCard({ zone }: { zone: typeof ZONES[0] }) {
  const [temp, setTemp] = useState(zone.temp);
  const [power, setPower] = useState(zone.power);

  useEffect(() => {
    const interval = setInterval(() => {
      setTemp(jitter(zone.temp, 1.5));
      setPower(jitter(zone.power, 8));
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [zone.temp, zone.power]);

  return (
    <div className={`rounded-lg border p-3 transition-all duration-300 ${
      zone.status === "warning"
        ? "border-amber/30 bg-amber/5 hover:border-amber/50"
        : "border-white/[0.06] bg-white/[0.02] hover:border-teal/20"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/30 bg-white/[0.04] px-1.5 py-0.5 rounded">
            {zone.id}
          </span>
          <span className="text-xs font-medium text-white/80">{zone.name}</span>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${
          zone.status === "warning" ? "bg-amber animate-pulse" : "bg-teal"
        }`} />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-2">
        <div>
          <div className="text-[10px] text-white/30 uppercase">Temp</div>
          <div className="font-mono text-sm text-white/80">{temp.toFixed(1)}°C</div>
        </div>
        <div>
          <div className="text-[10px] text-white/30 uppercase">Power</div>
          <div className="font-mono text-sm text-white/80">{power.toFixed(0)} kW</div>
        </div>
        <div>
          <div className="text-[10px] text-white/30 uppercase">Racks</div>
          <div className="font-mono text-sm text-white/80">{zone.racks}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Blockchain Verification Log ─── */
function VerificationLog() {
  const [logs, setLogs] = useState<Array<{ time: string; hash: string; type: string; block: number }>>([]);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const types = ["Energy Reading", "PUE Snapshot", "Water Flow", "Temp Aggregate", "CO₂ Rate", "GPU Utilization"];
    let block = 12847291;

    const addLog = () => {
      const hash = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      block += Math.floor(Math.random() * 3) + 1;
      setLogs(prev => {
        const next = [...prev, {
          time: new Date().toLocaleTimeString("en-US", { hour12: false }),
          hash: `0x${hash}...${hash.slice(0, 4)}`,
          type: types[Math.floor(Math.random() * types.length)],
          block,
        }];
        return next.slice(-8);
      });
    };

    addLog();
    const interval = setInterval(addLog, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={logRef} className="space-y-1.5 max-h-[240px] overflow-y-auto scrollbar-thin pr-1">
      {logs.map((log, i) => (
        <div
          key={`${log.time}-${i}`}
          className="flex items-center gap-3 text-[11px] font-mono py-1.5 px-2 rounded bg-white/[0.02] border border-white/[0.04] animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <CheckCircle className="w-3 h-3 text-teal shrink-0" />
          <span className="text-white/30 w-16 shrink-0">{log.time}</span>
          <span className="text-white/60 flex-1 truncate">{log.type}</span>
          <span className="text-teal/50 shrink-0">{log.hash}</span>
          <span className="text-white/20 shrink-0">#{log.block}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Efficiency Score Ring ─── */
function EfficiencyRing({ score, label }: { score: number; label: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "text-teal" : score >= 60 ? "text-amber" : "text-signal-red";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle
            cx="40" cy="40" r={radius} fill="none"
            className={`${color} stroke-current`}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-lg font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-[10px] text-white/40 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
}

/* ─── Custom Tooltip ─── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1120]/95 border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-white/40 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs font-mono" style={{ color: p.color }}>
          {p.name}: {p.value.toFixed(2)}
        </p>
      ))}
    </div>
  );
}

/* ─── Savings Counter ─── */
function SavingsCounter() {
  const [savings, setSavings] = useState({ energy: 12847, carbon: 5139, water: 8421 });

  useEffect(() => {
    const interval = setInterval(() => {
      setSavings(prev => ({
        energy: prev.energy + Math.floor(Math.random() * 5) + 1,
        carbon: prev.carbon + Math.floor(Math.random() * 3) + 1,
        water: prev.water + Math.floor(Math.random() * 4) + 1,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Energy Saved", value: savings.energy.toLocaleString(), unit: "kWh", icon: Zap, color: "text-teal" },
        { label: "Carbon Avoided", value: savings.carbon.toLocaleString(), unit: "kg CO₂", icon: Wind, color: "text-emerald-400" },
        { label: "Water Conserved", value: savings.water.toLocaleString(), unit: "liters", icon: Droplets, color: "text-cyan-400" },
      ].map(item => (
        <div key={item.label} className="text-center">
          <item.icon className={`w-5 h-5 ${item.color} mx-auto mb-2 opacity-60`} />
          <div className="font-mono text-xl font-bold text-white">
            {item.value}
          </div>
          <div className="text-[10px] text-white/30 mt-0.5">{item.unit}</div>
          <div className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function SensorsDemo() {
  const [history, setHistory] = useState(() => generateHistory(30));
  const [current, setCurrent] = useState(generateReading);
  const [uptime] = useState("99.97%");
  const [sensorsOnline] = useState(847);
  const [alertCount] = useState(2);

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const reading = generateReading();
      setCurrent(reading);
      setHistory(prev => {
        const next = [...prev, {
          time: reading.time,
          power: reading.power,
          pue: reading.pue,
          temp: reading.temp,
          waterFlow: reading.waterFlow,
          co2Rate: reading.co2Rate,
        }];
        return next.slice(-30);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Hourly distribution data (static)
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i.toString().padStart(2, "0")}:00`,
    power: jitter(320, 80),
    water: jitter(16, 6),
  }));

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* ─── Header ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0B1120]/80 backdrop-blur-xl">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Back to Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-cyan-500 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-[#0B1120]" />
                </div>
                <div>
                  <span className="font-display font-bold text-sm text-white">Mālama Sensors</span>
                  <span className="text-[10px] text-white/30 ml-2 uppercase tracking-wider">Live Demo</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-teal/70 bg-teal/10 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                  {sensorsOnline} sensors online
                </div>
                <div className="flex items-center gap-1.5 text-white/40 bg-white/[0.04] px-2 py-1 rounded">
                  <Clock className="w-3 h-3" />
                  Uptime {uptime}
                </div>
                {alertCount > 0 && (
                  <div className="flex items-center gap-1.5 text-amber bg-amber/10 px-2 py-1 rounded">
                    <AlertTriangle className="w-3 h-3" />
                    {alertCount} alerts
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Title Banner ─── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            <span className="text-[11px] text-teal uppercase tracking-widest font-medium">
              Simulated Data Center Monitoring
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Real-Time Sensor Dashboard
          </h1>
          <p className="text-sm text-white/40 max-w-2xl">
            This demo simulates what Mālama dMRV sensor integration looks like inside a data center.
            Every reading is blockchain-verified, creating trusted, objective environmental data
            that enables dynamic optimization.
          </p>
        </div>

        {/* ─── Live Metrics Grid ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <MetricCard
            icon={Zap} label="Total Power" value={current.power.toFixed(1)} unit="kW"
            trend={`PUE ${current.pue.toFixed(2)}`} color="bg-teal/10 text-teal" pulse
          />
          <MetricCard
            icon={Thermometer} label="Avg Temperature" value={current.temp.toFixed(1)} unit="°C"
            trend={current.temp > 24 ? "▲ warm" : "● normal"} color="bg-amber/10 text-amber"
          />
          <MetricCard
            icon={Droplets} label="Water Flow" value={current.waterFlow.toFixed(1)} unit="L/min"
            color="bg-cyan-500/10 text-cyan-400" pulse
          />
          <MetricCard
            icon={Wind} label="CO₂ Rate" value={current.co2Rate.toFixed(0)} unit="g/hr"
            trend="-12% vs avg" color="bg-emerald-500/10 text-emerald-400"
          />
          <MetricCard
            icon={Cpu} label="GPU Utilization" value={current.gpuUtil.toFixed(0)} unit="%"
            color="bg-violet-500/10 text-violet-400"
          />
          <MetricCard
            icon={Server} label="CPU Utilization" value={current.cpuUtil.toFixed(0)} unit="%"
            color="bg-blue-500/10 text-blue-400"
          />
        </div>

        {/* ─── Charts Row ─── */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Power & PUE Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-white">Power Consumption</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Real-time facility power draw (kW)</p>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-teal" />
                <span className="text-[10px] text-white/40">Live</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.82 0.15 175)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="oklch(0.82 0.15 175)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="power" stroke="oklch(0.82 0.15 175)" strokeWidth={2} fill="url(#powerGrad)" name="Power (kW)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature & Water Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-white">Temperature & Water</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Ambient temp (°C) and cooling water flow (L/min)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber" />
                  <span className="text-[10px] text-white/40">Temp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-white/40">Water</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="temp" stroke="oklch(0.82 0.15 80)" strokeWidth={2} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="waterFlow" stroke="#22d3ee" strokeWidth={2} dot={false} name="Water (L/min)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Zone Map + Blockchain Log ─── */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Zone Map */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-white">Facility Zones</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Real-time monitoring across 6 data center zones</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30">68 racks monitored</span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ZONES.map(zone => (
                <ZoneCard key={zone.id} zone={zone} />
              ))}
            </div>
          </div>

          {/* Blockchain Verification */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-teal" />
              <div>
                <h3 className="font-display text-sm font-semibold text-white">Blockchain Verification</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Cardano mainnet — immutable audit trail</p>
              </div>
            </div>
            <VerificationLog />
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
              <span className="text-[10px] text-white/30">Verified on-chain</span>
              <span className="text-[10px] text-teal/60 font-mono">Cardano L1</span>
            </div>
          </div>
        </div>

        {/* ─── Efficiency Scores + Hourly Distribution ─── */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Efficiency Scores */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-5">
              <h3 className="font-display text-sm font-semibold text-white">Efficiency Scores</h3>
              <p className="text-[10px] text-white/30 mt-0.5">AI-computed optimization ratings</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <EfficiencyRing score={87} label="Energy" />
              <EfficiencyRing score={92} label="Cooling" />
              <EfficiencyRing score={74} label="Utilization" />
            </div>
            <div className="mt-5 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-teal" />
                <span className="text-xs text-white/60">AI Optimization Insight</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Shifting 18% of inference workloads from Zone C2 to Zone A2 during off-peak hours
                could reduce total facility power by ~14 kW and lower PUE from 1.12 to 1.08.
              </p>
            </div>
          </div>

          {/* Hourly Distribution */}
          <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-white">24-Hour Distribution</h3>
                <p className="text-[10px] text-white/30 mt-0.5">Power consumption and water usage by hour</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-teal" />
                  <span className="text-[10px] text-white/40">Power</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-[10px] text-white/40">Water</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="power" fill="oklch(0.82 0.15 175)" radius={[2, 2, 0, 0]} opacity={0.7} name="Power (kW)" />
                <Bar dataKey="water" fill="#22d3ee" radius={[2, 2, 0, 0]} opacity={0.5} name="Water (L/min)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── Cumulative Savings ─── */}
        <div className="rounded-xl border border-teal/20 bg-gradient-to-br from-teal/5 to-transparent p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-teal" />
            <h3 className="font-display text-sm font-semibold text-white">
              Cumulative Savings from Sensor-Driven Optimization
            </h3>
            <span className="text-[10px] text-teal/50 bg-teal/10 px-1.5 py-0.5 rounded ml-2">Simulated YTD</span>
          </div>
          <SavingsCounter />
        </div>

        {/* ─── How It Works + CTA ─── */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* How It Works */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h3 className="font-display text-lg font-semibold text-white mb-5">How Mālama dMRV Works</h3>
            <div className="space-y-4">
              {[
                {
                  step: "01",
                  title: "Deploy Sensors",
                  desc: "IoT sensors installed at rack, row, and facility level measure power, temperature, humidity, water flow, and air quality in real time.",
                  icon: Radio,
                },
                {
                  step: "02",
                  title: "Verify on Blockchain",
                  desc: "Every reading is cryptographically signed and recorded to Cardano mainnet, creating a tamper-proof, immutable audit trail.",
                  icon: Shield,
                },
                {
                  step: "03",
                  title: "AI Analysis",
                  desc: "Machine learning models analyze sensor data to identify inefficiencies, predict failures, and recommend real-time optimizations.",
                  icon: Activity,
                },
                {
                  step: "04",
                  title: "Dynamic Optimization",
                  desc: "Automated workload shifting, cooling adjustments, and resource allocation based on verified sensor data — reducing impact dynamically.",
                  icon: TrendingDown,
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-teal/10 border border-teal/20 flex items-center justify-center">
                      <item.icon className="w-4.5 h-4.5 text-teal" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-teal/50">{item.step}</span>
                      <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                    </div>
                    <p className="text-[12px] text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="rounded-xl border border-teal/20 bg-gradient-to-br from-teal/[0.08] via-cyan-500/[0.04] to-transparent p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Waves className="w-5 h-5 text-teal" />
                <span className="text-[11px] text-teal uppercase tracking-widest font-medium">From Estimation to Truth</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white mb-3">
                Move Beyond Estimates.
                <br />
                <span className="text-teal">Measure What Matters.</span>
              </h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Current AI energy reporting relies on software estimates, rules of thumb, and self-reported data.
                Mālama dMRV sensors provide hardware-verified, blockchain-anchored measurements that create
                a trusted foundation for environmental accountability and dynamic optimization.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  "Hardware-level energy measurement at rack and facility scale",
                  "Blockchain-verified data — tamper-proof and auditable",
                  "AI-driven optimization reducing energy, carbon, and water in real time",
                  "Standardized reporting aligned with emerging regulatory frameworks",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 text-teal shrink-0 mt-0.5" />
                    <span className="text-[12px] text-white/50">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <a
                href="https://www.malamacarbon.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-teal text-[#0B1120] font-display font-semibold text-sm hover:bg-teal/90 transition-colors"
              >
                Learn More About Mālama
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href={AICO2_METHODOLOGY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border border-teal/30 text-teal font-display font-medium text-sm hover:bg-teal/10 transition-colors"
              >
                <FileDown className="w-4 h-4" />
                Read the AICo2 Methodology
              </a>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-white/40 text-sm hover:text-white/60 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to AI Energy Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Disclaimer ─── */}
        <div className="text-center py-6 border-t border-white/[0.04]">
          <p className="text-[11px] text-white/25 max-w-xl mx-auto">
            This is a simulated demonstration of Mālama dMRV sensor capabilities.
            All sensor readings, blockchain hashes, and optimization metrics shown are generated
            for illustrative purposes. Actual deployment metrics will vary by facility.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/10" />
            <span className="font-mono text-[10px] text-white/15 uppercase tracking-widest">
              Mālama Sensors Demo v1.0
            </span>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>
      </main>
    </div>
  );
}
