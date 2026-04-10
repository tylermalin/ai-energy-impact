/**
 * Admin Dashboard — Contributions Management
 * Observatory-themed admin panel for reviewing and managing
 * researcher/operator data contributions.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Inbox,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Home,
  AlertTriangle,
} from "lucide-react";

type ContributionStatus = "pending" | "reviewed" | "accepted" | "rejected";
type ContributionType = "new_model_data" | "correction" | "methodology" | "sensor_data" | "other";

const STATUS_CONFIG: Record<ContributionStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", icon: Clock },
  reviewed: { label: "Reviewed", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", icon: Eye },
  accepted: { label: "Accepted", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", icon: XCircle },
};

const TYPE_CONFIG: Record<ContributionType, { label: string; color: string }> = {
  new_model_data: { label: "New Data", color: "text-teal-400 bg-teal-400/10 border-teal-400/20" },
  correction: { label: "Correction", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  methodology: { label: "Methodology", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  sensor_data: { label: "Sensor Data", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
  other: { label: "Other", color: "text-gray-400 bg-gray-400/10 border-gray-400/20" },
};

function StatusBadge({ status }: { status: ContributionStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function TypeBadge({ type }: { type: ContributionType }) {
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.other;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function Admin() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContributionStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ContributionType | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<number, string>>({});
  const [sortField, setSortField] = useState<"createdAt" | "name" | "status">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Fetch contributions (admin-only)
  const { data: contributions, isLoading, refetch, error } = trpc.contributions.list.useQuery(
    { limit: 100, offset: 0 },
    { enabled: !!user && user.role === "admin", retry: false }
  );

  const updateStatus = trpc.contributions.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Client-side filtering and sorting
  const filteredContributions = useMemo(() => {
    if (!contributions) return [];
    let result = [...contributions];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.organization?.toLowerCase().includes(q) ?? false) ||
          c.message.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((c) => c.contributionType === typeFilter);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "createdAt") {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sortField === "status") {
        cmp = a.status.localeCompare(b.status);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [contributions, searchQuery, statusFilter, typeFilter, sortField, sortDir]);

  // Stats
  const stats = useMemo(() => {
    if (!contributions) return { total: 0, pending: 0, reviewed: 0, accepted: 0, rejected: 0 };
    return {
      total: contributions.length,
      pending: contributions.filter((c) => c.status === "pending").length,
      reviewed: contributions.filter((c) => c.status === "reviewed").length,
      accepted: contributions.filter((c) => c.status === "accepted").length,
      rejected: contributions.filter((c) => c.status === "rejected").length,
    };
  }, [contributions]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleStatusUpdate = (id: number, status: ContributionStatus) => {
    updateStatus.mutate({ id, status, adminNotes: adminNotes[id] || undefined });
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center dot-grid">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full border border-teal-500/20 bg-teal-500/5 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-3">Admin Access Required</h1>
          <p className="text-white/50 mb-8 text-sm">Sign in with your admin account to manage contributions.</p>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 px-8"
          >
            Sign In
          </Button>
          <div className="mt-4">
            <button onClick={() => setLocation("/")} className="text-white/30 hover:text-white/50 text-xs transition-colors">
              <ArrowLeft className="w-3 h-3 inline mr-1" /> Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not admin
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center dot-grid">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-3">Access Denied</h1>
          <p className="text-white/50 mb-8 text-sm">
            You are signed in as <span className="text-white/70">{user.name || user.email}</span>, but this page requires admin privileges.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 px-8"
          >
            <Home className="w-4 h-4 mr-2" /> Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] dot-grid">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0B1120]/95 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation("/")}
              className="text-white/40 hover:text-white/70 transition-colors"
              title="Back to site"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h1 className="font-['Space_Grotesk'] text-sm font-semibold text-white">Admin Dashboard</h1>
                <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider">Contributions Management</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 font-mono hidden sm:block">{user.name || user.email}</span>
            <button
              onClick={logout}
              className="text-white/30 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/[0.03]"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, color: "text-white", borderColor: "border-white/10" },
            { label: "Pending", value: stats.pending, color: "text-amber-400", borderColor: "border-amber-400/20" },
            { label: "Reviewed", value: stats.reviewed, color: "text-blue-400", borderColor: "border-blue-400/20" },
            { label: "Accepted", value: stats.accepted, color: "text-emerald-400", borderColor: "border-emerald-400/20" },
            { label: "Rejected", value: stats.rejected, color: "text-red-400", borderColor: "border-red-400/20" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl border ${stat.borderColor} bg-white/[0.02] p-4 text-center transition-colors hover:bg-white/[0.04]`}
            >
              <p className={`font-['Space_Grotesk'] text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters bar */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search by name, email, organization, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-teal-500/30 focus:ring-1 focus:ring-teal-500/20 transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-white/30 hidden sm:block" />
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "pending", "reviewed", "accepted", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === s
                        ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.05]"
                    }`}
                  >
                    {s === "all" ? "All" : STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type filter */}
            <div className="flex gap-1.5 flex-wrap">
              {(["all", "new_model_data", "correction", "methodology", "sensor_data", "other"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    typeFilter === t
                      ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                      : "bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.05]"
                  }`}
                >
                  {t === "all" ? "All Types" : TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/[0.05] transition-all text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 mb-6 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-red-300 text-sm mb-1">Failed to load contributions</p>
            <p className="text-red-400/50 text-xs font-mono">{error.message}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
            <p className="text-white/40 text-sm">Loading contributions...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filteredContributions.length === 0 && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-12 text-center">
            <Inbox className="w-10 h-10 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 text-sm mb-1">
              {contributions && contributions.length > 0 ? "No contributions match your filters" : "No contributions yet"}
            </p>
            <p className="text-white/25 text-xs">
              {contributions && contributions.length > 0
                ? "Try adjusting your search or filter criteria"
                : "Submissions from the Contribute form will appear here"}
            </p>
          </div>
        )}

        {/* Contributions table */}
        {!isLoading && !error && filteredContributions.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            {/* Table header */}
            <div className="bg-white/[0.03] border-b border-white/[0.06]">
              <div className="grid grid-cols-[1fr_140px_120px_120px_160px_80px] gap-4 px-5 py-3 text-[10px] font-mono uppercase tracking-wider text-white/30">
                <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-white/50 transition-colors text-left">
                  Contributor
                  {sortField === "name" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
                <span>Type</span>
                <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-white/50 transition-colors text-left">
                  Status
                  {sortField === "status" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
                <span>Organization</span>
                <button onClick={() => handleSort("createdAt")} className="flex items-center gap-1 hover:text-white/50 transition-colors text-left">
                  Date
                  {sortField === "createdAt" && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
                <span className="text-center">Actions</span>
              </div>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-white/[0.04]">
              {filteredContributions.map((contribution) => {
                const isExpanded = expandedId === contribution.id;
                return (
                  <div key={contribution.id} className="transition-colors hover:bg-white/[0.02]">
                    {/* Row */}
                    <div
                      className="grid grid-cols-[1fr_140px_120px_120px_160px_80px] gap-4 px-5 py-3.5 items-center cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : contribution.id)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white/90 font-medium truncate">{contribution.name}</p>
                        <p className="text-xs text-white/30 font-mono truncate">{contribution.email}</p>
                      </div>
                      <TypeBadge type={contribution.contributionType as ContributionType} />
                      <StatusBadge status={contribution.status as ContributionStatus} />
                      <p className="text-xs text-white/40 truncate">{contribution.organization || "—"}</p>
                      <p className="text-xs text-white/40 font-mono">
                        {new Date(contribution.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <div className="flex justify-center">
                        <button className="text-white/20 hover:text-teal-400 transition-colors">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-white/[0.04] bg-white/[0.01]">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                          {/* Message */}
                          <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-4 h-4 text-teal-400" />
                              <h4 className="text-xs font-mono uppercase tracking-wider text-white/40">Message</h4>
                            </div>
                            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{contribution.message}</p>
                            </div>

                            {contribution.dataUrl && (
                              <div className="mt-3">
                                <a
                                  href={contribution.dataUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  {contribution.dataUrl}
                                </a>
                              </div>
                            )}

                            {contribution.adminNotes && (
                              <div className="mt-4">
                                <h4 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">Admin Notes</h4>
                                <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                                  <p className="text-sm text-amber-300/70">{contribution.adminNotes}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions panel */}
                          <div>
                            <h4 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-3">Update Status</h4>
                            <div className="space-y-2">
                              {(["pending", "reviewed", "accepted", "rejected"] as ContributionStatus[]).map((status) => {
                                const config = STATUS_CONFIG[status];
                                const Icon = config.icon;
                                const isActive = contribution.status === status;
                                return (
                                  <button
                                    key={status}
                                    onClick={() => handleStatusUpdate(contribution.id, status)}
                                    disabled={updateStatus.isPending}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                                      isActive
                                        ? `${config.bg} ${config.color}`
                                        : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                                    } ${updateStatus.isPending ? "opacity-50" : ""}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    {config.label}
                                    {isActive && <span className="ml-auto text-[10px] opacity-60">Current</span>}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Admin notes input */}
                            <div className="mt-4">
                              <h4 className="text-xs font-mono uppercase tracking-wider text-white/40 mb-2">Admin Notes</h4>
                              <textarea
                                value={adminNotes[contribution.id] ?? contribution.adminNotes ?? ""}
                                onChange={(e) =>
                                  setAdminNotes((prev) => ({ ...prev, [contribution.id]: e.target.value }))
                                }
                                placeholder="Add internal notes about this contribution..."
                                rows={3}
                                className="w-full rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-xs p-3 placeholder:text-white/20 focus:outline-none focus:border-teal-500/30 focus:ring-1 focus:ring-teal-500/20 transition-all resize-none"
                              />
                              <button
                                onClick={() => {
                                  const notes = adminNotes[contribution.id];
                                  if (notes !== undefined) {
                                    updateStatus.mutate({
                                      id: contribution.id,
                                      status: contribution.status as ContributionStatus,
                                      adminNotes: notes,
                                    });
                                  }
                                }}
                                disabled={adminNotes[contribution.id] === undefined || updateStatus.isPending}
                                className="mt-2 w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white/40 text-xs hover:bg-white/[0.06] hover:text-white/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                Save Notes
                              </button>
                            </div>

                            {/* Metadata */}
                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                              <div className="space-y-2 text-[10px] font-mono text-white/25">
                                <div className="flex justify-between">
                                  <span>ID</span>
                                  <span className="text-white/40">#{contribution.id}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Created</span>
                                  <span className="text-white/40">
                                    {new Date(contribution.createdAt).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Updated</span>
                                  <span className="text-white/40">
                                    {new Date(contribution.updatedAt).toLocaleString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Table footer */}
            <div className="bg-white/[0.02] border-t border-white/[0.06] px-5 py-3 flex items-center justify-between">
              <p className="text-[10px] font-mono text-white/25 uppercase tracking-wider">
                Showing {filteredContributions.length} of {contributions?.length ?? 0} contributions
              </p>
              <p className="text-[10px] font-mono text-white/15">
                AI Energy Impact — Admin Panel
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
