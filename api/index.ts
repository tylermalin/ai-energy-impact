/**
 * api/index.ts — Vercel serverless function entrypoint.
 *
 * Wraps the existing Express app (the one used by `pnpm dev`) and exposes
 * it as a single Vercel function. `vercel.json` rewrites every /api/*
 * request to this handler, so the full tRPC + OAuth + ingest route surface
 * keeps working without any per-route refactoring.
 *
 * Local dev still uses server/_core/index.ts (which boots a real HTTP
 * server + Vite middleware). Production uses this file. Both share the
 * same router and middleware definitions so behaviour stays identical.
 */

import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { registerIngestRoutes } from "../server/_core/ingest";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// Body parsing — match the limits from server/_core/index.ts.
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// Ingestion pipeline trigger under /api/ingest/run (ADMIN_KEY-gated)
registerIngestRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Health-check that's safe to expose publicly.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    runtime: "vercel-serverless",
    env: process.env.NODE_ENV ?? "production",
  });
});

// Wrap in serverless-http. Vercel calls the default export with
// (req, res) and serverless-http translates to Express semantics.
const handler = serverless(app);

export default handler;
