import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
