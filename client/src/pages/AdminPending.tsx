/**
 * /admin/pending — reviewer queue for ingestion diffs.
 *
 * Auth: Phase 3 uses an ADMIN_KEY shared secret. First visit must include
 * ?key=<ADMIN_KEY> in the URL; subsequent navigation reads it from
 * sessionStorage. tRPC requests carry it via the x-admin-key header
 * (see client/src/main.tsx).
 */

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { captureAdminKeyFromUrl } from "@/lib/adminKey";
import { Check, X as XIcon, AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminPending() {
  const [keyPresent, setKeyPresent] = useState(false);
  const [tab, setTab] = useState<"pending" | "accepted" | "rejected">("pending");
  const [reviewNotes, setReviewNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    setKeyPresent(captureAdminKeyFromUrl() !== null);
  }, []);

  const listQuery = trpc.pending.list.useQuery(
    { status: tab, limit: 100 },
    { enabled: keyPresent, refetchOnWindowFocus: false },
  );
  const accept = trpc.pending.accept.useMutation({ onSuccess: () => listQuery.refetch() });
  const reject = trpc.pending.reject.useMutation({ onSuccess: () => listQuery.refetch() });

  const items = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  if (!keyPresent) {
    return (
      <AdminShell>
        <div className="max-w-xl mx-auto mt-20 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-display font-bold text-lg">Admin key required</h2>
          </div>
          <p className="text-sm text-amber-200/80 leading-relaxed mb-3">
            Visit <code className="font-data text-amber-100">/admin/pending?key=YOUR_KEY</code>{" "}
            using the value of <code className="font-data text-amber-100">ADMIN_KEY</code> in your{" "}
            <code className="font-data">.env</code>.
          </p>
          <p className="text-xs text-amber-200/60">
            The key is stored only in your tab&apos;s sessionStorage; closing the tab clears it.
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
              Pending updates
            </h1>
            <p className="text-sm text-white/45 mt-1">
              Ingestion adapters flagged these field changes against existing rows. Accept to
              apply, or reject to keep the live row unchanged.
            </p>
          </div>
          <button
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-white/10 text-white/70 hover:bg-white/5 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-white/[0.06] mb-6">
          {(["pending", "accepted", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-4 py-2 text-sm font-display font-medium capitalize transition-colors ${
                tab === s ? "text-white border-b-2 border-teal" : "text-white/40 hover:text-white/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {listQuery.error ? (
          <ErrorBox message={listQuery.error.message} />
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center text-white/40 text-sm">
            No {tab} updates.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((pu) => (
              <article
                key={pu.id}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-teal/80 font-display font-semibold">
                      #{pu.id} — {pu.adapter}
                    </span>
                    <div className="font-data text-[11px] text-white/35 mt-0.5">
                      fingerprint <span className="text-white/55">{pu.sourceFingerprint.slice(0, 12)}…</span>
                    </div>
                  </div>
                  <span className="text-[11px] text-white/40">
                    {pu.createdAt ? new Date(pu.createdAt).toISOString().slice(0, 16).replace("T", " ") : ""}
                  </span>
                </div>
                <p className="text-sm text-white/75 font-data leading-relaxed bg-black/30 border border-white/[0.04] rounded p-3 mb-4 break-all">
                  {pu.diffSummary || "(no diff summary)"}
                </p>
                {tab === "pending" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Optional review notes…"
                      value={reviewNotes[pu.id] ?? ""}
                      onChange={(e) =>
                        setReviewNotes((r) => ({ ...r, [pu.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-teal/40 mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          accept.mutate({ id: pu.id, reviewNotes: reviewNotes[pu.id] })
                        }
                        disabled={accept.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-semibold rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-40"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          reject.mutate({ id: pu.id, reviewNotes: reviewNotes[pu.id] })
                        }
                        disabled={reject.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-display font-semibold rounded-lg bg-white/[0.04] border border-white/10 text-white/70 hover:bg-white/[0.08] disabled:opacity-40"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-white/45">
                    Reviewed{" "}
                    {pu.reviewedAt ? new Date(pu.reviewedAt).toISOString().slice(0, 16).replace("T", " ") : "—"}{" "}
                    by <span className="text-white/70">{pu.reviewedBy ?? "—"}</span>
                    {pu.reviewNotes ? (
                      <p className="mt-2 text-white/55">&ldquo;{pu.reviewNotes}&rdquo;</p>
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
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
    <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-300">
      <span className="font-display font-bold">Error:</span> {message}
    </div>
  );
}
