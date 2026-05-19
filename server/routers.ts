import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { drizzle } from "drizzle-orm/mysql2";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { adminKeyProcedure, adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createContribution,
  getContributionById,
  listContributions,
  updateContributionStatus,
} from "./db";
import { sanityClient } from "./sanity";
import { QUERIES } from "./sanity-schemas";
import {
  ingestionRuns,
  modelEnergyRecords,
  pendingUpdates,
} from "../drizzle/schema";
import { ADAPTERS, runAll, runOne } from "../lib/ingestion/run";
import { getDashboardModels } from "../lib/dashboard/models";

// Lazy DB handle for the new ingestion mutations.
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set.");
  }
  return drizzle(process.env.DATABASE_URL);
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Sanity CMS content
  cms: router({
    /** Public: get all blog posts */
    posts: publicProcedure.query(async () => {
      return sanityClient.fetch(QUERIES.allPosts);
    }),

    /** Public: get featured blog posts */
    featuredPosts: publicProcedure.query(async () => {
      return sanityClient.fetch(QUERIES.featuredPosts);
    }),

    /** Public: get a single blog post by slug */
    postBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return sanityClient.fetch(QUERIES.postBySlug, { slug: input.slug });
      }),

    /** Public: get posts by category */
    postsByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return sanityClient.fetch(QUERIES.postsByCategory, { category: input.category });
      }),

    /**
     * Public: dashboard read path — reads from MySQL model_energy_records,
     * dedupes by (modelName, category), merges fields across sources.
     *
     * Returns { rows, totalRowCount, dedupedRowCount } so the UI can show
     * the dedup ratio in the footer ("Showing 110 of 166 measurements").
     *
     * Falls back to an empty result on any error (network, no DATABASE_URL,
     * etc) — the client side fall back to ADAPTED_MODELS handles the rest.
     */
    modelsForDashboard: publicProcedure.query(async () => {
      try {
        return await getDashboardModels();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[modelsForDashboard] DB read failed, returning empty:", err);
        return { rows: [], totalRowCount: 0, dedupedRowCount: 0 };
      }
    }),

    /** Public: get all team members */
    team: publicProcedure.query(async () => {
      return sanityClient.fetch(QUERIES.allTeamMembers);
    }),

    /** Public: get site settings */
    siteSettings: publicProcedure.query(async () => {
      return sanityClient.fetch(QUERIES.siteSettings);
    }),
  }),

  contributions: router({
    /** Public: submit a new contribution (no auth required) */
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required").max(255),
          email: z.string().email("Valid email is required").max(320),
          organization: z.string().max(255).optional(),
          contributionType: z.enum([
            "new_model_data",
            "correction",
            "methodology",
            "sensor_data",
            "other",
          ]),
          message: z.string().min(10, "Please provide at least 10 characters").max(5000),
          dataUrl: z.string().url().max(2000).optional().or(z.literal("")),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createContribution({
          name: input.name,
          email: input.email,
          organization: input.organization ?? null,
          contributionType: input.contributionType,
          message: input.message,
          dataUrl: input.dataUrl || null,
        });

        // Notify the project owner about the new submission
        const typeLabels: Record<string, string> = {
          new_model_data: "New Model Data",
          correction: "Data Correction",
          methodology: "Methodology Improvement",
          sensor_data: "Sensor Data",
          other: "Other",
        };

        await notifyOwner({
          title: `New Contribution: ${typeLabels[input.contributionType] ?? input.contributionType}`,
          content: [
            `**From:** ${input.name} (${input.email})`,
            input.organization ? `**Organization:** ${input.organization}` : "",
            `**Type:** ${typeLabels[input.contributionType] ?? input.contributionType}`,
            `**Message:** ${input.message.slice(0, 500)}${input.message.length > 500 ? "..." : ""}`,
            input.dataUrl ? `**Data URL:** ${input.dataUrl}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        }).catch((err) => {
          console.warn("[Contributions] Failed to notify owner:", err);
        });

        return { success: true, id };
      }),

    /** Admin: list all contributions with pagination */
    list: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const limit = input?.limit ?? 50;
        const offset = input?.offset ?? 0;
        return listContributions(limit, offset);
      }),

    /** Admin: get a single contribution by ID */
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContributionById(input.id);
      }),

    /** Admin: update the status of a contribution */
    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["pending", "reviewed", "accepted", "rejected"]),
          adminNotes: z.string().max(2000).optional(),
        })
      )
      .mutation(async ({ input }) => {
        await updateContributionStatus(input.id, input.status, input.adminNotes);
        return { success: true };
      }),
  }),

  /* ================================================================
   * Phase 3 — Ingestion pipeline tRPC surface
   * Gated by adminKeyProcedure: either OAuth admin role OR X-Admin-Key
   * header matching process.env.ADMIN_KEY.
   * ================================================================ */
  ingest: router({
    /** List registered adapters and what they cover. */
    adapters: adminKeyProcedure.query(() => {
      return ADAPTERS.map((a) => ({
        name: a.name,
        coverage: a.coverage,
        description: a.description,
      }));
    }),

    /** Run all adapters now. Returns the RunSummary. */
    runAll: adminKeyProcedure.mutation(async () => {
      return await runAll();
    }),

    /** Run a single adapter by name. */
    runOne: adminKeyProcedure
      .input(z.object({ adapter: z.string().min(1).max(64) }))
      .mutation(async ({ input }) => {
        return await runOne(input.adapter);
      }),

    /** Recent ingestion run history (latest first). */
    runs: adminKeyProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(200).default(50),
          adapter: z.string().min(1).max(64).optional(),
        }).optional(),
      )
      .query(async ({ input }) => {
        const db = getDb();
        const limit = input?.limit ?? 50;
        if (input?.adapter) {
          return db
            .select()
            .from(ingestionRuns)
            .where(eq(ingestionRuns.adapter, input.adapter))
            .orderBy(desc(ingestionRuns.startedAt))
            .limit(limit);
        }
        return db
          .select()
          .from(ingestionRuns)
          .orderBy(desc(ingestionRuns.startedAt))
          .limit(limit);
      }),

    /** Adapter health: count consecutive failures, flag >=3 streak. */
    health: adminKeyProcedure.query(async () => {
      const db = getDb();
      const allRuns = await db
        .select()
        .from(ingestionRuns)
        .orderBy(desc(ingestionRuns.startedAt))
        .limit(500);
      // Build per-adapter streak from the most recent runs.
      const byAdapter = new Map<string, { lastStatus: string; streak: number; lastRun: Date | null }>();
      for (const run of allRuns) {
        const entry = byAdapter.get(run.adapter);
        if (!entry) {
          byAdapter.set(run.adapter, {
            lastStatus: run.status,
            streak: run.status === "failed" ? 1 : 0,
            lastRun: run.startedAt,
          });
          continue;
        }
        if (entry.streak > 0 && run.status === "failed") {
          entry.streak++;
        }
      }
      return ADAPTERS.map((a) => {
        const entry = byAdapter.get(a.name);
        return {
          adapter: a.name,
          coverage: a.coverage,
          lastStatus: entry?.lastStatus ?? "never_run",
          lastRun: entry?.lastRun ?? null,
          consecutiveFailures: entry?.streak ?? 0,
          needsAttention: (entry?.streak ?? 0) >= 3,
        };
      });
    }),
  }),

  pending: router({
    /** List pending updates awaiting human review. */
    list: adminKeyProcedure
      .input(
        z.object({
          status: z.enum(["pending", "accepted", "rejected"]).default("pending"),
          limit: z.number().min(1).max(200).default(50),
        }).optional(),
      )
      .query(async ({ input }) => {
        const db = getDb();
        const status = input?.status ?? "pending";
        const limit = input?.limit ?? 50;
        return db
          .select()
          .from(pendingUpdates)
          .where(eq(pendingUpdates.status, status))
          .orderBy(desc(pendingUpdates.createdAt))
          .limit(limit);
      }),

    /** Accept a pending update: apply the proposed values to the live row. */
    accept: adminKeyProcedure
      .input(
        z.object({
          id: z.number(),
          reviewNotes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        const [pu] = await db
          .select()
          .from(pendingUpdates)
          .where(eq(pendingUpdates.id, input.id))
          .limit(1);
        if (!pu) throw new Error(`pending update ${input.id} not found`);
        if (pu.status !== "pending") {
          throw new Error(`pending update ${input.id} already ${pu.status}`);
        }
        if (!pu.targetRecordId) {
          throw new Error(`pending update ${input.id} has no target record`);
        }

        // Apply the proposed JSON to the live row. We trust the adapter's
        // shape because storage.ts wrote it as NormalizedRecord.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proposed = pu.proposed as any;
        await db
          .update(modelEnergyRecords)
          .set({
            ...proposed,
            // Don't overwrite the DB-managed id / fingerprint / promotion fields.
            id: undefined,
            sourceFingerprint: undefined,
            lastVerifiedAt: new Date(),
          })
          .where(eq(modelEnergyRecords.id, pu.targetRecordId));

        await db
          .update(pendingUpdates)
          .set({
            status: "accepted",
            reviewedAt: new Date(),
            reviewedBy: ctx.user?.email ?? "admin-key",
            reviewNotes: input.reviewNotes ?? null,
          })
          .where(eq(pendingUpdates.id, input.id));

        return { success: true };
      }),

    /** Reject a pending update: mark rejected, do NOT modify live row. */
    reject: adminKeyProcedure
      .input(
        z.object({
          id: z.number(),
          reviewNotes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        await db
          .update(pendingUpdates)
          .set({
            status: "rejected",
            reviewedAt: new Date(),
            reviewedBy: ctx.user?.email ?? "admin-key",
            reviewNotes: input.reviewNotes ?? null,
          })
          .where(and(eq(pendingUpdates.id, input.id), eq(pendingUpdates.status, "pending")));
        return { success: true };
      }),

    /** Count pending updates awaiting review (used for the admin nav badge). */
    count: adminKeyProcedure.query(async () => {
      const db = getDb();
      const rows = await db
        .select({ n: sql<number>`count(*)` })
        .from(pendingUpdates)
        .where(eq(pendingUpdates.status, "pending"));
      return rows[0]?.n ?? 0;
    }),
  }),
});

export type AppRouter = typeof appRouter;
