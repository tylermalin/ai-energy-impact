/**
 * Code Tab Banner
 *
 * Renders only when the active Data Explorer tab is "code". Acknowledges
 * that no public lab publishes per-task energy directly, so most code
 * rows are derived from token-count × text-model energy.
 */

import { Code2 } from "lucide-react";

export function CodeTabBanner() {
  return (
    <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
      <Code2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" aria-hidden />
      <div className="text-sm text-white/65 leading-relaxed">
        <span className="text-emerald-300 font-medium">Most code rows are derived.</span>{" "}
        No public lab publishes per-task energy for SWE-bench Verified end-to-end runs.
        We compute these values from token-count × the underlying text-model energy.{" "}
        <a href="#methodology" className="text-emerald-300/80 underline underline-offset-2 hover:text-emerald-200">
          See methodology
        </a>{" "}
        for the derivation.
      </div>
    </div>
  );
}
