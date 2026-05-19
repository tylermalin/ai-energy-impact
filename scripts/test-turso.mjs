import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";

const url = process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;
const c = createClient({ url, authToken });

console.log("=== Row counts by table ===");
for (const t of ["users", "model_energy_records", "contributions", "ingestion_runs", "pending_updates", "ranking_runs"]) {
  const r = await c.execute(`SELECT COUNT(*) AS n FROM ${t}`);
  console.log(`  ${t.padEnd(25)} ${r.rows[0].n}`);
}

console.log("\n=== model_energy_records data completeness ===");
const stats = await c.execute(`
  SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN energyWh IS NOT NULL THEN 1 ELSE 0 END) AS has_energy,
    SUM(CASE WHEN carbonGCO2e IS NOT NULL THEN 1 ELSE 0 END) AS has_carbon,
    SUM(CASE WHEN waterMl IS NOT NULL THEN 1 ELSE 0 END) AS has_water,
    SUM(CASE WHEN inTop20 = 1 THEN 1 ELSE 0 END) AS in_top20
  FROM model_energy_records
`);
const s = stats.rows[0];
console.log(`  total rows:       ${s.total}`);
console.log(`  with energyWh:    ${s.has_energy}`);
console.log(`  with carbonGCO2e: ${s.has_carbon}`);
console.log(`  with waterMl:     ${s.has_water}`);
console.log(`  inTop20:          ${s.in_top20}`);

console.log("\n=== By category ===");
const byCat = await c.execute(`
  SELECT category, COUNT(*) AS n,
    SUM(CASE WHEN energyWh IS NOT NULL THEN 1 ELSE 0 END) AS with_energy,
    SUM(CASE WHEN carbonGCO2e IS NOT NULL THEN 1 ELSE 0 END) AS with_carbon
  FROM model_energy_records GROUP BY category ORDER BY n DESC
`);
for (const r of byCat.rows) console.log(`  ${String(r.category).padEnd(10)} total=${r.n} energy=${r.with_energy} carbon=${r.with_carbon}`);

console.log("\n=== Sample top-20 text models with full data ===");
const sample = await c.execute(`
  SELECT modelName, vendor, energyWh, carbonGCO2e, waterMl, classification, confidence
  FROM model_energy_records
  WHERE category='text' AND inTop20=1 AND energyWh IS NOT NULL AND carbonGCO2e IS NOT NULL
  ORDER BY compositeRank LIMIT 5
`);
for (const r of sample.rows) {
  console.log(`  ${r.modelName} (${r.vendor})`);
  console.log(`    energy=${r.energyWh}Wh  carbon=${r.carbonGCO2e}gCO2e  water=${r.waterMl}mL  [${r.classification}/${r.confidence}]`);
}
