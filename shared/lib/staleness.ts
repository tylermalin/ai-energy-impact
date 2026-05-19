/**
 * Staleness classification for model rows.
 *
 * - fresh:      lastVerifiedAt within the last 30 days
 * - aging:      within 30..90 days
 * - stale:      older than 90 days
 * - unverified: lastVerifiedAt is missing (e.g. seed Top-20 rows that
 *               haven't yet been touched by an ingestion adapter)
 *
 * Used by the dashboard's freshness dot and by adapter logic when
 * deciding whether to re-pull a source.
 */

export type StalenessLevel = "fresh" | "aging" | "stale" | "unverified";

export const STALENESS_THRESHOLDS = {
  freshDays: 30,
  agingDays: 90,
} as const;

export function computeStalenessLevel(
  lastVerifiedAt: Date | string | null | undefined,
  now: Date = new Date(),
): StalenessLevel {
  if (!lastVerifiedAt) return "unverified";

  const verifiedDate =
    typeof lastVerifiedAt === "string" ? new Date(lastVerifiedAt) : lastVerifiedAt;

  if (Number.isNaN(verifiedDate.getTime())) return "unverified";

  const ageMs = now.getTime() - verifiedDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays < STALENESS_THRESHOLDS.freshDays) return "fresh";
  if (ageDays < STALENESS_THRESHOLDS.agingDays) return "aging";
  return "stale";
}

/**
 * Display metadata per staleness level — drives the freshness-dot
 * color, accessible label, and tooltip in the UI.
 */
export const STALENESS_DISPLAY: Record<
  StalenessLevel,
  { label: string; dotClass: string; tooltip: string }
> = {
  fresh: {
    label: "Fresh",
    dotClass: "bg-emerald-400",
    tooltip: "Verified within the last 30 days.",
  },
  aging: {
    label: "Aging",
    dotClass: "bg-amber-400",
    tooltip: "Verified 30–90 days ago. Refresh upcoming.",
  },
  stale: {
    label: "Stale",
    dotClass: "bg-red-500",
    tooltip: "Last verified more than 90 days ago.",
  },
  unverified: {
    label: "Unverified",
    dotClass: "bg-white/20",
    tooltip:
      "Listed but not yet measured by an ingestion adapter. Expect energy/carbon/water values to be null.",
  },
};
