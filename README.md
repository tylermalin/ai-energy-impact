<p align="center">
  <img src="docs/logo.png" alt="AI Power" width="320" />
</p>

<h1 align="center">AI Energy Impact</h1>

<p align="center">
  <strong>The environmental cost of artificial intelligence — measured, sourced, and open.</strong><br/>
  <a href="https://www.aipower.fyi">aipower.fyi</a>
</p>

<p align="center">
  <em>A project of the <a href="https://malamafoundation.org">Mālama Foundation</a>.</em>
</p>

---

## Vision

AI is becoming infrastructure. By 2030, data centers are projected to consume 1,000+ TWh annually — more electricity than entire industrialized nations. Yet the data needed to understand and reduce that footprint is **fragmented, estimated, and often deliberately opaque**.

The Federation of American Scientists has documented that AI providers "report whatever they choose, however they choose." The true carbon footprint of major AI providers may be up to **662% higher** than publicly reported figures.

We are building the public-interest measurement layer for AI.

## Mission

**You can't reduce what you can't measure.**

AI Energy Impact aggregates the best available research on AI energy consumption, carbon emissions, and water usage into a single transparent dashboard — while being explicit about the limitations of every number we publish.

Our long-term goal is to push the industry from speculative estimates toward **hardware-level, sensor-verified measurement** through [Mālama Labs](https://malamalabs.com) dMRV sensors deployed directly inside data centers.

AI Energy Impact is a project of the [Mālama Foundation](https://malamafoundation.org) — a nonprofit advancing transparent environmental measurement for emerging technologies.

## What's on the site

| Section | What it shows |
|---|---|
| **Hero stats** | Live counts: models analyzed, max energy / carbon / water per prompt |
| **Impact Overview** | Per-inference energy across all indexed models (log scale) |
| **Top Energy Consumers** | Highest-energy models ranked across all categories |
| **Model Distribution** | Pie chart of model coverage by category |
| **Data Explorer** | Sortable, filterable, searchable table of every model with full provenance |
| **Methodology** | Every source, every assumption, every known limitation |
| **Contribute** | Open submission path for new measurements or corrections |

Each row in the Data Explorer carries: classification (measured / derived / estimated), confidence (high / medium / low), source URL, measurement date, hardware, context length, batch size, and Mālama AICo2 audit fields (tau, F factor, PUE, grid intensity, WUE).

## Methodology

### Provenance hierarchy

Every measurement is classified by how it was produced:

- **Measured** — direct GPU power readings from published benchmarks (ML.Energy, Hugging Face Energy Score, Google Cloud disclosed numbers)
- **Derived** — energy computed from disclosed token throughput × hardware utilization × known TDP
- **Estimated** — model-class average applied via the Mālama AICo2 framework when no direct measurement exists

### Mālama AICo2 framework

For rows in the "estimated" tier, we compute:

```
energyWh        = tau × F × (model_class_baseline_Wh)
carbonGCO2e     = energyWh × grid_intensity_gCO2e_per_kWh
waterMl         = (energyWh / 1000) × WUE_L_per_kWh × 1000
```

Where:

- `tau` — task scaling factor (varies by category: text, code, image, video)
- `F` — facility multiplier accounting for PUE and idle overhead
- `grid_intensity` — defaults to US 2024 average (~400 gCO2e/kWh); regional overrides where known
- `WUE` — industry-average water usage effectiveness (~1.8 L/kWh); facility-specific where disclosed

Read the full PDF: [Mālama AICo2 Methodology](https://aipower.fyi/methodology)

### Why this approach

The industry has no standard. Companies report on incompatible bases (some count GPU-only, some count full datacenter; some use market-based RECs, some use location-based grid factors; some include training, most don't). The result is an information vacuum.

We chose to publish anyway, but with **radical transparency**: every cell on the dashboard links back to its source, every formula is documented, every assumption is flagged with a confidence level. If a number is wrong, we want it to be easy to point at and fix — which is the point.

## Data sources

| Source | Type | Coverage |
|---|---|---|
| MIT Technology Review / ML.Energy | Primary measurement | Text, image, video |
| Google Cloud Infrastructure Blog | Primary measurement | Gemini family, full-system methodology |
| Hugging Face Energy Score | Primary measurement | 166+ open models on H100 |
| Artificial Analysis | Secondary (derived) | Frontier closed models |
| BenchLM, LMArena, SWE-Bench | Secondary (ranking) | Composite rank, scaffold, SWE-bench scores |
| System cards (vendor disclosures) | Primary | Where vendors publish |
| FAS, Carnegie Mellon, IEA, EPA | Reference | Policy framing, grid factors |

A full list with citations lives in the Methodology section of the site.

## Architecture

```
┌──────────────────────────┐
│  Public sources          │
│  (HF, ML.Energy, AA,     │
│   BenchLM, LMArena, etc) │
└──────────┬───────────────┘
           │ adapters (lib/ingestion/adapters/*.ts)
           ▼
┌──────────────────────────┐
│  ingestion pipeline      │  ──▶  Turso (libSQL)
│  (lib/ingestion/run.ts)  │       model_energy_records
└──────────┬───────────────┘       ingestion_runs
           │                        pending_updates
           ▼
┌──────────────────────────┐
│  Mālama AICo2 estimator  │  fills carbon + water where energy is known
│  (lib/methodology/*.ts)  │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  tRPC + Vercel function  │  /api/trpc/cms.modelsForDashboard
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│  React dashboard         │  Hero, Insights, Data Explorer
│  (client/src/components) │
└──────────────────────────┘
```

**Stack:** Vite + React + tRPC + Drizzle (SQLite/libSQL) + Turso + Vercel · Tailwind + Radix · Framer Motion

## Running locally

```bash
pnpm install
vercel env pull .env.local        # provides TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
pnpm db:push                       # apply migrations to Turso
pnpm db:seed-top20                 # seed the curated top-20 model identities
pnpm ingest                        # run all 8 ingestion adapters
pnpm aico2:apply                   # fill carbon + water via Mālama AICo2
pnpm dev                           # http://localhost:5173
```

Other scripts:

- `node scripts/test-turso.mjs` — DB connection + completeness report
- `pnpm db:verify` — provenance integrity check
- `pnpm ingest <adapter>` — run a single adapter (e.g. `pnpm ingest huggingface-energy-score`)

## Contributing

We want your measurements, corrections, and challenges. Three paths:

1. **Submit data** — use the [Contribute form on the site](https://www.aipower.fyi#contribute) for new model data, corrections, or methodology improvements
2. **Write an adapter** — add a new source by dropping a file in `lib/ingestion/adapters/` (see existing adapters for the pattern)
3. **Question a number** — open an issue with a citation and we'll trace it

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgements

This work would not be possible without the open data published by ML.Energy, Hugging Face, Google Cloud, the Federation of American Scientists, Carnegie Mellon's energy policy team, and the academic researchers cited throughout the site. Errors are ours, not theirs.

---

<p align="center">
  <a href="https://www.aipower.fyi"><strong>aipower.fyi</strong></a> · a project of the <a href="https://malamafoundation.org">Mālama Foundation</a> · built with <a href="https://malamalabs.com">Mālama Labs</a>
</p>
