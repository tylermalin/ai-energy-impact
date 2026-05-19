/**
 * Drizzle schema — SQLite (Turso / libSQL).
 *
 * Translated from the original MySQL schema during the Vercel Turso
 * migration. Equivalences applied:
 *   - mysqlTable          → sqliteTable
 *   - mysqlEnum           → text(..., { enum: [...] as const })  (string union, no DB-level CHECK)
 *   - int autoincrement   → integer({ mode: "number" }).primaryKey({ autoIncrement: true })
 *   - varchar / text      → text                                  (SQLite has no length limit)
 *   - double / real       → real
 *   - boolean             → integer({ mode: "boolean" })
 *   - json                → text({ mode: "json" }).$type<T>()
 *   - timestamp.defaultNow() → integer({ mode: "timestamp" }).default(sql`(unixepoch())`)
 *   - onUpdateNow()       → $onUpdate(() => new Date())            (app-side; SQLite has no auto-update)
 *
 * Indexes remain. Unique index on sourceFingerprint preserved.
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ==================================================================
 * Auth + contributions (pre-existing, ported to SQLite)
 * ================================================================== */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] as const })
    .default("user")
    .notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const contributions = sqliteTable("contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"),
  contributionType: text("contributionType", {
    enum: [
      "new_model_data",
      "correction",
      "methodology",
      "sensor_data",
      "other",
    ] as const,
  }).notNull(),
  message: text("message").notNull(),
  dataUrl: text("dataUrl"),
  status: text("status", {
    enum: ["pending", "reviewed", "accepted", "rejected"] as const,
  })
    .default("pending")
    .notNull(),
  adminNotes: text("adminNotes"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Contribution = typeof contributions.$inferSelect;
export type InsertContribution = typeof contributions.$inferInsert;

/* ==================================================================
 * Phase 1 + 3b — Provenance + category-aware + methodology audit
 * (operational mirror; Sanity is no longer canonical for model data)
 * ================================================================== */

/** Type-level enums (SQLite has no native enum; these are TS unions). */
export type ModelCategory = "text" | "image" | "video" | "code" | "audio" | "other";
export type TaskClass =
  | "text_generation"
  | "reasoning"
  | "image_diffusion"
  | "video_generation"
  | "audio_asr"
  | "classification"
  | "detection"
  | "translation"
  | "agentic_workflow"
  | "code_swe_task";
export type EnergyUnit =
  | "wh_per_inference"
  | "wh_per_image"
  | "wh_per_video_second"
  | "wh_per_coding_task";
export type Classification = "measured" | "derived" | "estimated";
export type Confidence = "high" | "medium" | "medium-low" | "low";
export type PromptClass =
  | "single_turn_chat"
  | "long_context"
  | "tool_use"
  | "rag"
  | "multi_turn";
export type TrainingOrInference = "inference" | "training" | "both";
export type FacilityClass =
  | "hyperscale_modern"
  | "hyperscale_standard"
  | "enterprise"
  | "legacy"
  | "unknown";
export type ModelStatus = "active" | "sunsetting" | "deprecated";

export const modelEnergyRecords = sqliteTable(
  "model_energy_records",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Identity
    modelName: text("modelName").notNull(),
    modelFamily: text("modelFamily").notNull(),
    modelVersion: text("modelVersion"),
    vendor: text("vendor").notNull(),
    parameters: text("parameters"),
    openWeight: integer("openWeight", { mode: "boolean" }).default(false).notNull(),

    // Categorization
    category: text("category", {
      enum: ["text", "image", "video", "code", "audio", "other"] as const,
    }).notNull(),
    taskClass: text("taskClass", {
      enum: [
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
      ] as const,
    }).notNull(),
    energyUnit: text("energyUnit", {
      enum: [
        "wh_per_inference",
        "wh_per_image",
        "wh_per_video_second",
        "wh_per_coding_task",
      ] as const,
    }).notNull(),

    // Measurements
    energyWh: real("energyWh"),
    energyWhMin: real("energyWhMin"),
    energyWhMax: real("energyWhMax"),
    carbonGCO2e: real("carbonGCO2e"),
    waterMl: real("waterMl"),

    // Mālama AICo2 audit fields (Phase 3b)
    tauApplied: real("tauApplied"),
    fApplied: real("fApplied"),
    pueApplied: real("pueApplied"),
    gridIntensityGCO2ePerKWh: real("gridIntensityGCO2ePerKWh"),
    wueLPerKWh: real("wueLPerKWh"),
    facilityClass: text("facilityClass", {
      enum: ["hyperscale_modern", "hyperscale_standard", "enterprise", "legacy", "unknown"] as const,
    }),
    hardwareClass: text("hardwareClass"),
    methodologyVersion: text("methodologyVersion"),

    // Monte Carlo P10/P90 (schema-only for v1; populated in v1.1)
    energyWhP10: real("energyWhP10"),
    energyWhP90: real("energyWhP90"),
    carbonGCO2eP10: real("carbonGCO2eP10"),
    carbonGCO2eP90: real("carbonGCO2eP90"),
    waterMlP10: real("waterMlP10"),
    waterMlP90: real("waterMlP90"),

    // Provenance (required)
    classification: text("classification", {
      enum: ["measured", "derived", "estimated"] as const,
    }).notNull(),
    confidence: text("confidence", {
      enum: ["high", "medium", "medium-low", "low"] as const,
    }).notNull(),
    sourceName: text("sourceName").notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    sourceCitation: text("sourceCitation"),
    measurementDate: integer("measurementDate", { mode: "timestamp" }).notNull(),
    ingestedAt: integer("ingestedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    lastVerifiedAt: integer("lastVerifiedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),

    // Conditions
    hardware: text("hardware"),
    softwareVersion: text("softwareVersion"),
    contextLength: integer("contextLength"),
    batchSize: integer("batchSize"),
    promptClass: text("promptClass", {
      enum: ["single_turn_chat", "long_context", "tool_use", "rag", "multi_turn"] as const,
    }),
    trainingOrInference: text("trainingOrInference", {
      enum: ["inference", "training", "both"] as const,
    })
      .default("inference")
      .notNull(),
    standardizedConditions: text("standardizedConditions", { mode: "json" }).$type<
      Record<string, unknown>
    >(),

    // Ranking (ingested from BenchLM)
    compositeRank: integer("compositeRank"),
    inTop20: integer("inTop20", { mode: "boolean" }).default(false).notNull(),

    // Code-specific
    scaffold: text("scaffold"),
    sweVerified: real("sweVerified"),
    swePro: real("swePro"),

    // Lifecycle
    status: text("status", {
      enum: ["active", "sunsetting", "deprecated"] as const,
    })
      .default("active")
      .notNull(),
    statusNote: text("statusNote"),

    // Notes
    utilityScore: text("utilityScore"),
    notes: text("notes"),

    // Dedup + promotion
    sourceFingerprint: text("sourceFingerprint").notNull(),
    promotedAt: integer("promotedAt", { mode: "timestamp" }),
    sanityDocId: text("sanityDocId"),

    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull()
      .$onUpdate(() => new Date()),
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

export const pendingUpdates = sqliteTable(
  "pending_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceFingerprint: text("sourceFingerprint").notNull(),
    targetRecordId: integer("targetRecordId"),
    adapter: text("adapter").notNull(),
    proposed: text("proposed", { mode: "json" }).$type<Record<string, unknown>>().notNull(),
    current: text("current", { mode: "json" }).$type<Record<string, unknown> | null>(),
    diffSummary: text("diffSummary"),
    status: text("status", {
      enum: ["pending", "accepted", "rejected"] as const,
    })
      .default("pending")
      .notNull(),
    reviewedBy: text("reviewedBy"),
    reviewedAt: integer("reviewedAt", { mode: "timestamp" }),
    reviewNotes: text("reviewNotes"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    statusIdx: index("idx_pu_status").on(t.status),
    adapterIdx: index("idx_pu_adapter").on(t.adapter),
  }),
);

export type PendingUpdate = typeof pendingUpdates.$inferSelect;
export type InsertPendingUpdate = typeof pendingUpdates.$inferInsert;

export const ingestionRuns = sqliteTable(
  "ingestion_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adapter: text("adapter").notNull(),
    startedAt: integer("startedAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    finishedAt: integer("finishedAt", { mode: "timestamp" }),
    status: text("status", {
      enum: ["running", "succeeded", "failed", "partial"] as const,
    })
      .default("running")
      .notNull(),
    summary: text("summary", { mode: "json" }).$type<Record<string, unknown>>(),
    errors: text("errors"),
    consecutiveFailures: integer("consecutiveFailures").default(0).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (t) => ({
    adapterIdx: index("idx_ir_adapter").on(t.adapter),
    startedAtIdx: index("idx_ir_startedAt").on(t.startedAt),
  }),
);

export type IngestionRun = typeof ingestionRuns.$inferSelect;
export type InsertIngestionRun = typeof ingestionRuns.$inferInsert;

export const rankingRuns = sqliteTable(
  "ranking_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull(),
    category: text("category", {
      enum: ["text", "image", "video", "code", "audio", "other"] as const,
    }).notNull(),
    pulledAt: integer("pulledAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    rawPayloadHash: text("rawPayloadHash").notNull(),
    appliedChanges: text("appliedChanges", { mode: "json" }).$type<Record<string, unknown>>(),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (t) => ({
    sourceCategoryIdx: index("idx_rr_source_category").on(t.source, t.category),
    pulledAtIdx: index("idx_rr_pulledAt").on(t.pulledAt),
  }),
);

export type RankingRun = typeof rankingRuns.$inferSelect;
export type InsertRankingRun = typeof rankingRuns.$inferInsert;
