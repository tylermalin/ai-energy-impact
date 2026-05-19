/**
 * /admin/ingestion — adapter health + run log + manual trigger.
 *
 * Auth: ADMIN_KEY shared secret (see AdminPending.tsx for details).
 */

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { captureAdminKeyFromUrl } from "@/lib/adminKey";
import { AlertTriangle, Play, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";

export default function AdminIngestion() {
  const [keyPresent, setKeyPresent] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);

  useEffect(() => {
    setKeyPresent(captureAdminKeyFromUrl() !== null);
  }, []);

  const adapters = trpc.ingest.adapters.useQuery(undefined, {
    enabled: keyPresent,
    refetchOnWindowFocus: false,
  });
  const health = trpc.ingest.health.useQuery(undefined, {
    enabled: keyPresent,
    refetchOnWindowFocus: false,
  });
  const runs = trpc.ingest.runs.useQuery(
    { limit: 50 },
    { enabled: keyPresent, refetchOnWindowFocus: false },
  );
  const runAll = trpc.ingest.runAll.useMutation({
    onSuccess: () => {
      runs.refetch();
      health.refetch();
    },
  });
  const runOne = trpc.ingest.runOne.useMutation({
    onSuccess: () => {
      runs.refetch();
      health.refetch();
    },
  });

  const adaptersByName = useMemo(() => {
    const m = new Map<string, { coverage: readonly string[]; description: string }>();
    for (const a of adapters.data ?? []) m.set(a.name, a);
    return m;
  }, [adapters.data]);

  if (!keyPresent) {
    return (
      <AdminShell>
        <div className="max-w-xl mx-auto mt-20 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-display font-bold text-lg">Admin key required</h2>
          </div>
          <p className="text-sm text-amber-200/80 leading-relaxed">
            Visit <code className="font-data text-amber-100">/admin/ingestion?key=YOUR_KEY</code>{" "}
            using the value of <code className="font-data text-amber-100">ADMIN_KEY</code> in
            your <code className="font-data">.env</code>.
          </p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Ingestion runs
            </h1>
            <p className="text-sm text-white/45 mt-1">
              Adapter health, recent runs, and manual trigger.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => runAll.mutate()}
              disabled={runAll.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-semibold rounded-lg bg-teal/15 border border-teal/30 text-teal hover:bg-teal/25 disabled:opacity-40"
            >
              <Play className={`w-3.5 h-3.5 ${runAll.isPending ? "animate-pulse" : ""}`} />
              Run all adapters
            </button>
            <button
              onClick={() => {
                runs.refetch();
                health.refetch();
              }}
              disabled={runs.isFetching}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${runs.isFetching ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {runAll.isError ? <ErrorBox message={runAll.error.message} /> : null}

        {/* Adapter health */}
        <section className="mb-10">
          <h2 className="text-xs font-display font-bold uppercase tracking-[0.12em] text-teal/70 mb-3">
            Adapter health
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(health.data ?? []).map((h) => {
              const meta = adaptersByName.get(h.adapter);
              return (
                <article
                  key={h.adapter}
                  className={`rounded-xl border p-4 ${
                    h.needsAttention
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-white/[0.06] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-display font-semibold text-white">
                      {h.adapter}
                    </span>
                    <button
                      onClick={() => runOne.mutate({ adapter: h.adapter })}
                      disabled={runOne.isPending}
                      title="Run this adapter only"
                      className="text-[10px] text-teal/70 hover:text-teal font-medium uppercase tracking-wider disabled:opacity-40"
                    >
                      Run
                    </button>
                  </div>
                  <div className="text-[11px] text-white/40 mb-2">{meta?.description ?? ""}</div>
                  <div className="flex items-center gap-3 text-[11px] font-data">
                    <span
                      className={
                        h.lastStatus === "succeeded"
                          ? "text-emerald-300"
                          : h.lastStatus === "partial"
                            ? "text-amber-300"
                            : h.lastStatus === "failed"
                              ? "text-red-300"
                              : "text-white/40"
                      }
                    >
                      {h.lastStatus}
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="text-white/50">
                      {h.lastRun
                        ? new Date(h.lastRun).toISOString().slice(0, 16).replace("T", " ")
                        : "never run"}
                    </span>
                    {h.needsAttention ? (
                      <span className="ml-auto inline-flex items-center gap-1 text-red-300 font-semibold">
                        <AlertTriangle className="w-3 h-3" />
                        {h.consecutiveFailures}× failed
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Run log */}
        <section>
          <h2 className="text-xs font-display font-bold uppercase tracking-[0.12em] text-teal/70 mb-3">
            Recent runs
          </h2>
          {runs.error ? (
            <ErrorBox message={runs.error.message} />
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-teal/[0.03] text-[10px] font-bold uppercase tracking-[0.12em] text-teal/70">
                    <th className="w-8 px-3 py-2.5" />
                    <th className="px-3 py-2.5 text-left">Started</th>
                    <th className="px-3 py-2.5 text-left">Adapter</th>
                    <th className="px-3 py-2.5 text-left">Status</th>
                    <th className="px-3 py-2.5 text-right">Inserted</th>
                    <th className="px-3 py-2.5 text-right">Pending</th>
                    <th className="px-3 py-2.5 text-right">Unchanged</th>
                    <th className="px-3 py-2.5 text-right">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {(runs.data ?? []).map((r) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const summary = (r.summary ?? {}) as any;
                    const isExpanded = expandedRunId === r.id;
                    return (
                      <>
                        <tr
                          key={r.id}
                          onClick={() => setExpandedRunId(isExpanded ? null : r.id)}
                          className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors cursor-pointer"
                        >
                          <td className="px-3 py-2 text-white/40">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </td>
                          <td className="px-3 py-2 font-data text-white/55">
                            {r.startedAt ? new Date(r.startedAt).toISOString().slice(0, 16).replace("T", " ") : ""}
                          </td>
                          <td className="px-3 py-2 text-white/80 font-medium">{r.adapter}</td>
                          <td className={`px-3 py-2 font-semibold ${
                            r.status === "succeeded"
                              ? "text-emerald-300"
                              : r.status === "partial"
                                ? "text-amber-300"
                                : r.status === "failed"
                                  ? "text-red-300"
                                  : "text-white/40"
                          }`}>
                            {r.status}
                          </td>
                          <td className="px-3 py-2 text-right font-data text-white/55">{summary.inserted ?? 0}</td>
                          <td className="px-3 py-2 text-right font-data text-white/55">{summary.pending ?? 0}</td>
                          <td className="px-3 py-2 text-right font-data text-white/55">{summary.unchanged ?? 0}</td>
                          <td className={`px-3 py-2 text-right font-data ${(summary.errors?.length ?? 0) > 0 ? "text-red-300" : "text-white/40"}`}>
                            {summary.errors?.length ?? 0}
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr key={`${r.id}-detail`}>
                            <td colSpan={8} className="bg-black/30 border-b border-white/[0.04] px-6 py-3">
                              <div className="text-[11px] text-white/50 mb-1">
                                Duration: <span className="text-white/70 font-data">{summary.durationMs ?? "?"}ms</span>
                              </div>
                              {r.errors ? (
                                <pre className="text-[11px] text-red-300/80 font-data whitespace-pre-wrap mt-2">
                                  {r.errors}
                                </pre>
                              ) : (
                                <div className="text-[11px] text-white/40">No errors.</div>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background dot-grid">
      <header className="border-b border-white/[0.06] bg-white/[0.015]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-teal/80 font-display font-bold">
              aipower.fyi
            </span>
            <span className="text-xs text-white/30">/ admin</span>
          </div>
          <nav className="flex gap-4 text-xs font-display font-medium text-white/55">
            <a href="/admin/pending" className="hover:text-white">Pending</a>
            <a href="/admin/ingestion" className="hover:text-white">Ingestion runs</a>
            <a href="/admin" className="hover:text-white">Contributions</a>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300 mb-4">
      <span className="font-display font-bold">Error:</span> {message}
    </div>
  );
}
