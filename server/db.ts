/**
 * server/db.ts — Drizzle queries for users + contributions.
 *
 * Ported to libSQL / Turso during the Vercel migration. MySQL's
 * `onDuplicateKeyUpdate` is now `onConflictDoUpdate({ target: ... })`,
 * and `insertId` is replaced by `.returning({ id })`.
 */

import { desc, eq } from "drizzle-orm";
import { contributions, InsertContribution, InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getDb as getDbClient } from "./_core/db-client";

/** Returns the Drizzle db handle, or null if no DB URL is configured. */
export async function getDb() {
  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) return null;
  try {
    return getDbClient();
  } catch (err) {
    console.warn("[Database] Failed to connect:", err);
    return null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // SQLite/libSQL uses onConflictDoUpdate with the conflict target
    // explicitly specified (vs MySQL's implicit-by-unique-key behavior).
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Contribution queries ──

export async function createContribution(data: InsertContribution): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  // SQLite returns rows from RETURNING; use that to portably grab the id.
  const rows = await db.insert(contributions).values(data).returning({ id: contributions.id });
  const id = rows[0]?.id;
  if (typeof id !== "number") {
    throw new Error("createContribution: could not determine insert id");
  }
  return id;
}

export async function listContributions(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contributions)
    .orderBy(desc(contributions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getContributionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contributions).where(eq(contributions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateContributionStatus(
  id: number,
  status: "pending" | "reviewed" | "accepted" | "rejected",
  adminNotes?: string,
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const updateData: Record<string, unknown> = { status };
  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }
  await db.update(contributions).set(updateData).where(eq(contributions.id, id));
}
