/**
 * Category Tabs
 *
 * Primary tab bar for the Data Explorer: Text | Image | Video | Code.
 * Audio + Other render in a separate "Additional Models" view below the
 * primary tabs (handled by the parent DataExplorer, not here).
 */

import { CATEGORY_DISPLAY, type DisplayCategory } from "@/lib/modelsAdapter";

const PRIMARY_CATEGORIES: DisplayCategory[] = ["text", "image", "video", "code"];

export function CategoryTabs({
  active,
  onChange,
  countsByCategory,
}: {
  active: DisplayCategory;
  onChange: (c: DisplayCategory) => void;
  countsByCategory: Partial<Record<DisplayCategory, number>>;
}) {
  return (
    <div
      role="tablist"
      aria-label="Model categories"
      className="flex flex-wrap gap-1 border-b border-white/[0.06] mb-5"
    >
      {PRIMARY_CATEGORIES.map((cat) => {
        const cfg = CATEGORY_DISPLAY[cat];
        const isActive = cat === active;
        const count = countsByCategory[cat] ?? 0;
        return (
          <button
            key={cat}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(cat)}
            className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-display font-medium transition-colors
              ${
                isActive
                  ? "text-white"
                  : "text-white/45 hover:text-white/70 hover:bg-white/[0.03]"
              }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: cfg.color }}
            />
            {cfg.label}
            <span className="text-[11px] text-white/35 font-data">{count}</span>
            {isActive && (
              <span
                aria-hidden
                className="absolute bottom-[-1px] left-0 right-0 h-[2px]"
                style={{ background: cfg.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
