import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Admin OR ADMIN_KEY procedure — accepts either:
 *   (a) an authenticated user with role="admin" (OAuth path), or
 *   (b) a request carrying the X-Admin-Key header matching process.env.ADMIN_KEY
 *
 * Used by Phase 3 ingestion + pending-review mutations so dev / cron
 * invocations work without a full OAuth login. When ADMIN_KEY is unset
 * the header path is disabled; the OAuth path still works.
 */
export const adminKeyProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // OAuth admin path
    if (ctx.user && ctx.user.role === 'admin') {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }

    // Shared-secret header path
    const expected = process.env.ADMIN_KEY;
    const provided = ctx.req.header("x-admin-key");
    if (expected && provided && expected.length === provided.length) {
      let mismatch = 0;
      for (let i = 0; i < expected.length; i++) {
        mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
      }
      if (mismatch === 0) {
        return next({ ctx });
      }
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin role or X-Admin-Key header required.",
    });
  }),
);
