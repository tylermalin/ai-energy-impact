import {
  boolean,
  double,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contributions table — stores researcher/operator form submissions.
 * Each row represents one data contribution or methodology improvement suggestion.
 */
export const contributions = mysqlTable("contributions", {
  id: int("id").autoincrement().primaryKey(),
  /** Contributor's full name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Contributor's email address */
  email: varchar("email", { length: 320 }).notNull(),
  /** Organization or affiliation */
  organization: varchar("organization", { length: 255 }),
  /** Type of contribution */
  contributionType: mysqlEnum("contributionType", [
    "new_model_data",
    "correction",
    "methodology",
    "sensor_data",
    "other",
  ]).notNull(),
  /** The main message / description of the contribution */
  message: text("message").notNull(),
  /** Optional URL to supporting data, paper, or resource */
  dataUrl: text("dataUrl"),
  /** Review status */
  status: mysqlEnum("status", ["pending", "reviewed", "accepted", "rejected"])
    .default("pending")
    .notNull(),
  /** Admin notes on the contribution */
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;

/* ==================================================================
 * Phase 1 — Provenance + category-aware schema (operational mirror)
 *
 * Sanity is the canonical store for row-level model data. These MySQL
 * tables are the operational mirror used by the ingestion pipeline
 * (Phase 3): adapters land rows here, humans review in /admin/pending,
 * approved rows are promoted to Sanity. The dashboard reads from
 * Sanity, not from this mirror.
 * ================================================================== */

/**
 * model_energy_records — full mirror of the Sanity aiModel schema.
 * Ingestion writes here; promoted-to-Sanity rows are flagged via
 * `promotedAt` so the diff against Sanity remains queryable.
 */
export const modelEnergyRecords = mysqlTable(
  "model_energy_records",
  {
    id: int("id").autoincrement().primaryKey(),

    // Identity
    modelName: varchar("modelName", { length: 255 }).notNull(),
    modelFamily: varchar("modelFamily", { length: 128 }).notNull(),
    modelVersion: varchar("modelVersion", { length: 128 }),
    vendor: varchar("vendor", { length: 128 }).notNull(),
    parameters: varchar("parameters", { length: 64 }),
    openWeight: boolean("openWeight").default(false).notNull(),

    // Categorization
    category: mysqlEnum("category", ["text", "image", "video", "code", "audio", "other"]).notNull(),
    taskClass: mysqlEnum("taskClass", [
      "text_generation",
      "reasoning",
      "image_diffusion",
      "video_generation",
      "audio_asr",
      "classification",
      "detection",
      "translation",
      "agentic_workflow",
      "code_swe_task",
    ]).notNull(),
    energyUnit: mysqlEnum("energyUnit", [
      "wh_per_inference",
      "wh_per_image",
      "wh_per_video_second",
      "wh_per_coding_task",
    ]).notNull(),

    // Measurements
    energyWh: double("energyWh"),
    energyWhMin: double("energyWhMin"),
    energyWhMax: double("energyWhMax"),
    carbonGCO2e: double("carbonGCO2e"),
    waterMl: double("waterMl"),

    // Mālama AICo2 Methodology audit fields (Phase 3b)
    // Records WHICH τ / F / PUE / grid intensity / WUE were applied to
    // derive this row's numbers, per Section 8.1 of the methodology.
    // Null when the row's energy came from a third-party measurement
    // and AICo2 was only used downstream for carbon/water conversion.
    tauApplied: double("tauApplied"),
    fApplied: double("fApplied"),
    pueApplied: double("pueApplied"),
    gridIntensityGCO2ePerKWh: double("gridIntensityGCO2ePerKWh"),
    wueLPerKWh: double("wueLPerKWh"),
    facilityClass: mysqlEnum("facilityClass", [
      "hyperscale_modern",
      "hyperscale_standard",
      "enterprise",
      "legacy",
      "unknown",
    ]),
    hardwareClass: varchar("hardwareClass", { length: 64 }),
    methodologyVersion: varchar("methodologyVersion", { length: 64 }),

    // Confidence intervals (per methodology Section 4.2 — Monte Carlo P10/P90).
    // v1 ships with single-point estimates; v1.1 fills the P10/P90 columns.
    energyWhP10: double("energyWhP10"),
    energyWhP90: double("energyWhP90"),
    carbonGCO2eP10: double("carbonGCO2eP10"),
    carbonGCO2eP90: double("carbonGCO2eP90"),
    waterMlP10: double("waterMlP10"),
    waterMlP90: double("waterMlP90"),

    // Provenance (required)
    classification: mysqlEnum("classification", ["measured", "derived", "estimated"]).notNull(),
    confidence: mysqlEnum("confidence", ["high", "medium", "medium-low", "low"]).notNull(),
    sourceName: varchar("sourceName", { length: 255 }).notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    sourceCitation: text("sourceCitation"),
    measurementDate: timestamp("measurementDate").notNull(),
    ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
    lastVerifiedAt: timestamp("lastVerifiedAt").defaultNow().notNull(),

    // Conditions
    hardware: varchar("hardware", { length: 128 }),
    softwareVersion: varchar("softwareVersion", { length: 128 }),
    contextLength: int("contextLength"),
    batchSize: int("batchSize"),
    promptClass: mysqlEnum("promptClass", [
      "single_turn_chat",
      "long_context",
      "tool_use",
      "rag",
      "multi_turn",
    ]),
    trainingOrInference: mysqlEnum("trainingOrInference", ["inference", "training", "both"])
      .default("inference")
      .notNull(),
    standardizedConditions: json("standardizedConditions"),

    // Ranking (ingested from BenchLM, never computed)
    compositeRank: int("compositeRank"),
    inTop20: boolean("inTop20").default(false).notNull(),

    // Code-specific
    scaffold: varchar("scaffold", { length: 128 }),
    sweVerified: double("sweVerified"),
    swePro: double("swePro"),

    // Lifecycle
    status: mysqlEnum("status", ["active", "sunsetting", "deprecated"]).default("active").notNull(),
    statusNote: varchar("statusNote", { length: 255 }),

    // Notes
    utilityScore: varchar("utilityScore", { length: 255 }),
    notes: text("notes"),

    // Source-fingerprint for dedupe across (model, source, measurementDate)
    sourceFingerprint: varchar("sourceFingerprint", { length: 128 }).notNull(),

    // Promotion to Sanity
    promotedAt: timestamp("promotedAt"),
    sanityDocId: varchar("sanityDocId", { length: 64 }),

    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    modelNameIdx: index("idx_mer_modelName").on(t.modelName),
    categoryIdx: index("idx_mer_category").on(t.category),
    classificationIdx: index("idx_mer_classification").on(t.classification),
    lastVerifiedAtIdx: index("idx_mer_lastVerifiedAt").on(t.lastVerifiedAt),
    inTop20Idx: index("idx_mer_inTop20").on(t.inTop20),
    sourceFingerprintIdx: uniqueIndex("uniq_mer_sourceFingerprint").on(t.sourceFingerprint),
  }),
);

export type ModelEnergyRecord = typeof modelEnergyRecords.$inferSelect;
export type InsertModelEnergyRecord = typeof modelEnergyRecords.$inferInsert;

/**
 * pending_updates — diffs from ingestion that need human review before
 * the corresponding model_energy_records row is updated and promoted.
 */
export const pendingUpdates = mysqlTable(
  "pending_updates",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceFingerprint: varchar("sourceFingerprint", { length: 128 }).notNull(),
    targetRecordId: int("targetRecordId"),
    adapter: varchar("adapter", { length: 64 }).notNull(),
    proposed: json("proposed").notNull(),
    current: json("current"),
    diffSummary: text("diffSummary"),
    status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
    reviewedBy: varchar("reviewedBy", { length: 320 }),
    reviewedAt: timestamp("reviewedAt"),
    reviewNotes: text("reviewNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (t) => ({
    statusIdx: index("idx_pu_status").on(t.status),
    adapterIdx: index("idx_pu_adapter").on(t.adapter),
  }),
);

export type PendingUpdate = typeof pendingUpdates.$inferSelect;
export type InsertPendingUpdate = typeof pendingUpdates.$inferInsert;

/**
 * ingestion_runs — audit trail for every adapter execution.
 */
export const ingestionRuns = mysqlTable(
  "ingestion_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    adapter: varchar("adapter", { length: 64 }).notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    finishedAt: timestamp("finishedAt"),
    status: mysqlEnum("status", ["running", "succeeded", "failed", "partial"])
      .default("running")
      .notNull(),
    summary: json("summary"),
    errors: text("errors"),
    consecutiveFailures: int("consecutiveFailures").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    adapterIdx: index("idx_ir_adapter").on(t.adapter),
    startedAtIdx: index("idx_ir_startedAt").on(t.startedAt),
  }),
);

export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type InsertIngestionRun = typeof ingestionRuns.$inferInsert;

/**
 * ranking_runs — audit trail for every BenchLM (or alternative) ranking
 * ingestion. We do not compute the ranking ourselves; this table simply
 * records what was pulled and which rows were updated as a result.
 */
export const rankingRuns = mysqlTable(
  "ranking_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    source: varchar("source", { length: 64 }).notNull(),
    category: mysqlEnum("category", ["text", "image", "video", "code", "audio", "other"]).notNull(),
    pulledAt: timestamp("pulledAt").defaultNow().notNull(),
    rawPayloadHash: varchar("rawPayloadHash", { length: 128 }).notNull(),
    appliedChanges: json("appliedChanges"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => ({
    sourceCategoryIdx: index("idx_rr_source_category").on(t.source, t.category),
    pulledAtIdx: index("idx_rr_pulledAt").on(t.pulledAt),
  }),
);

export type RankingRun = typeof rankingRuns.$inferSelect;
export type InsertRankingRun = typeof rankingRuns.$inferInsert;
