/**
 * Shared sourceFingerprint generator.
 *
 * Must match the algorithm used by scripts/seed-top20.ts (which baked in
 * the seed Top-20 rows) so adapter-produced rows that correspond to the
 * same (model, category, source, measurementDate) dedupe correctly.
 *
 * Fingerprint formula: sha256(modelName::category::sourceName::dateISO).slice(0, 32)
 */

import { createHash } from "node:crypto";

export function makeFingerprint(args: {
  modelName: string;
  category: string;
  sourceName: string;
  measurementDate: Date | string;
}): string {
  const date =
    args.measurementDate instanceof Date
      ? args.measurementDate
      : new Date(args.measurementDate);
  const dateIso = date.toISOString();
  const h = createHash("sha256");
  h.update(`${args.modelName}::${args.category}::${args.sourceName}::${dateIso}`);
  return h.digest("hex").slice(0, 32);
}

/**
 * Normalize a measurement date to the first day of its month (UTC).
 * Adapters that pull "current snapshot" data use this so multiple runs
 * within the same month dedupe to one row.
 */
export function firstOfMonth(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
