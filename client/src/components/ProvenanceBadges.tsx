/**
 * Provenance Badges
 *
 * - <ClassificationBadge> renders the green/amber/grey "Measured / Derived /
 *   Estimated" pill with a tooltip explaining each level.
 * - <FreshnessDot> renders the colored dot indicating staleness, with a
 *   tooltip showing the exact lastVerifiedAt and the threshold reasoning.
 *
 * Both components match the Data Observatory aesthetic — small, low-chrome,
 * tooltip-on-hover, no layout shifts.
 */

import {
  CLASSIFICATION_DISPLAY,
  type Classification,
} from "../../../shared/lib/provenance";
import {
  computeStalenessLevel,
  STALENESS_DISPLAY,
} from "../../../shared/lib/staleness";

export function ClassificationBadge({
  classification,
  className = "",
}: {
  classification: Classification;
  className?: string;
}) {
  const cfg = CLASSIFICATION_DISPLAY[classification];
  return (
    <span
      title={cfg.tooltip}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-semibold uppercase tracking-wider ${cfg.bgClass} ${cfg.textClass} ${className}`}
    >
      {cfg.label}
    </span>
  );
}

export function FreshnessDot({
  lastVerifiedAt,
  className = "",
}: {
  lastVerifiedAt: Date | string | null | undefined;
  className?: string;
}) {
  const level = computeStalenessLevel(lastVerifiedAt);
  const cfg = STALENESS_DISPLAY[level];

  const verifiedLabel = lastVerifiedAt
    ? new Date(lastVerifiedAt).toISOString().slice(0, 10)
    : "never";

  return (
    <span
      title={`${cfg.label} — last verified ${verifiedLabel}. ${cfg.tooltip}`}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
      <span className="text-[10px] text-white/40 uppercase tracking-wider">{cfg.label}</span>
    </span>
  );
}
