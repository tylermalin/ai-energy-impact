import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createContribution,
  getContributionById,
  listContributions,
  updateContributionStatus,
} from "./db";
import { sanityClient } from "./sanity";
import { QUERIES } from "./sanity-schemas";

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

    /** Public: get all active AI models from Sanity */
    models: publicProcedure.query(async () => {
      return sanityClient.fetch(QUERIES.allModels);
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
});

export type AppRouter = typeof appRouter;
