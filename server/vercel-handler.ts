/**
 * server/vercel-handler.ts — Vercel serverless function source.
 *
 * Wraps the existing Express app and exposes it as a single Vercel function.
 * `vercel.json` rewrites every /api/* request to /api/index.js, which is the
 * esbuild-bundled output of THIS file (see vercel.json buildCommand).
 *
 * Why we bundle instead of letting Vercel's @vercel/node compile api/index.ts
 * directly: our tsconfig uses `moduleResolution: bundler`, which lets imports
 * omit `.js` extensions. @vercel/node's NFT tracer follows Node-native ESM
 * resolution, which requires `.js` extensions, so it can't find files like
 * `../server/_core/oauth` at trace time. Pre-bundling inlines every local
 * import so the deployed function is self-contained.
 *
 * Local dev still uses server/_core/index.ts (which boots a real HTTP
 * server + Vite middleware). Production uses this file (bundled to
 * api/index.js). Both share the same router and middleware definitions
 * so behaviour stays identical.
 */

import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerIngestRoutes } from "./_core/ingest";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);
registerIngestRoutes(app);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    runtime: "vercel-serverless",
    env: process.env.NODE_ENV ?? "production",
  });
});

// Vercel's Node runtime calls the default export as (req, res). An Express
// `app` is itself a (req, res) handler — pass it directly, no adapter needed.
export default app;
