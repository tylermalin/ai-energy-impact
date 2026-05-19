import { config } from "dotenv";
config({ path: ".env.local" });

const mod = await import("../lib/dashboard/models.ts");
const result = await mod.getDashboardModels();

console.log("=== getDashboardModels() result ===");
console.log(`totalRowCount  (pre-dedup):  ${result.totalRowCount}`);
console.log(`dedupedRowCount (post-dedup): ${result.dedupedRowCount}`);

const byCat = {};
let withEnergy = 0;
let withCarbon = 0;
for (const r of result.rows) {
  byCat[r.category] = (byCat[r.category] ?? 0) + 1;
  if (r.energyWh !== null) withEnergy++;
  if (r.carbonGCO2e !== null) withCarbon++;
}
console.log("\nDeduped rows by category:");
for (const [c, n] of Object.entries(byCat)) console.log(`  ${c.padEnd(8)} ${n}`);
console.log(`\nrows with energyWh:    ${withEnergy}`);
console.log(`rows with carbonGCO2e: ${withCarbon}`);

console.log("\nTop 5 by energyWh (descending):");
const sorted = result.rows
  .filter((r) => r.energyWh !== null)
  .sort((a, b) => b.energyWh - a.energyWh)
  .slice(0, 5);
for (const r of sorted) {
  console.log(`  ${r.modelName} (${r.category}): ${r.energyWh.toFixed(2)} Wh, ${r.carbonGCO2e?.toFixed(2) ?? "?"} gCO2e`);
}
