// server/vercel-handler.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { desc, eq } from "drizzle-orm";

// drizzle/schema.ts
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";
var users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => /* @__PURE__ */ new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
});
var contributions = sqliteTable("contributions", {
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
      "other"
    ]
  }).notNull(),
  message: text("message").notNull(),
  dataUrl: text("dataUrl"),
  status: text("status", {
    enum: ["pending", "reviewed", "accepted", "rejected"]
  }).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => /* @__PURE__ */ new Date())
});
var modelEnergyRecords = sqliteTable(
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
      enum: ["text", "image", "video", "code", "audio", "other"]
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
        "code_swe_task"
      ]
    }).notNull(),
    energyUnit: text("energyUnit", {
      enum: [
        "wh_per_inference",
        "wh_per_image",
        "wh_per_video_second",
        "wh_per_coding_task"
      ]
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
      enum: ["hyperscale_modern", "hyperscale_standard", "enterprise", "legacy", "unknown"]
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
      enum: ["measured", "derived", "estimated"]
    }).notNull(),
    confidence: text("confidence", {
      enum: ["high", "medium", "medium-low", "low"]
    }).notNull(),
    sourceName: text("sourceName").notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    sourceCitation: text("sourceCitation"),
    measurementDate: integer("measurementDate", { mode: "timestamp" }).notNull(),
    ingestedAt: integer("ingestedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    lastVerifiedAt: integer("lastVerifiedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    // Conditions
    hardware: text("hardware"),
    softwareVersion: text("softwareVersion"),
    contextLength: integer("contextLength"),
    batchSize: integer("batchSize"),
    promptClass: text("promptClass", {
      enum: ["single_turn_chat", "long_context", "tool_use", "rag", "multi_turn"]
    }),
    trainingOrInference: text("trainingOrInference", {
      enum: ["inference", "training", "both"]
    }).default("inference").notNull(),
    standardizedConditions: text("standardizedConditions", { mode: "json" }).$type(),
    // Ranking (ingested from BenchLM)
    compositeRank: integer("compositeRank"),
    inTop20: integer("inTop20", { mode: "boolean" }).default(false).notNull(),
    // Code-specific
    scaffold: text("scaffold"),
    sweVerified: real("sweVerified"),
    swePro: real("swePro"),
    // Lifecycle
    status: text("status", {
      enum: ["active", "sunsetting", "deprecated"]
    }).default("active").notNull(),
    statusNote: text("statusNote"),
    // Notes
    utilityScore: text("utilityScore"),
    notes: text("notes"),
    // Dedup + promotion
    sourceFingerprint: text("sourceFingerprint").notNull(),
    promotedAt: integer("promotedAt", { mode: "timestamp" }),
    sanityDocId: text("sanityDocId"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => /* @__PURE__ */ new Date())
  },
  (t2) => ({
    modelNameIdx: index("idx_mer_modelName").on(t2.modelName),
    categoryIdx: index("idx_mer_category").on(t2.category),
    classificationIdx: index("idx_mer_classification").on(t2.classification),
    lastVerifiedAtIdx: index("idx_mer_lastVerifiedAt").on(t2.lastVerifiedAt),
    inTop20Idx: index("idx_mer_inTop20").on(t2.inTop20),
    sourceFingerprintIdx: uniqueIndex("uniq_mer_sourceFingerprint").on(t2.sourceFingerprint)
  })
);
var pendingUpdates = sqliteTable(
  "pending_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceFingerprint: text("sourceFingerprint").notNull(),
    targetRecordId: integer("targetRecordId"),
    adapter: text("adapter").notNull(),
    proposed: text("proposed", { mode: "json" }).$type().notNull(),
    current: text("current", { mode: "json" }).$type(),
    diffSummary: text("diffSummary"),
    status: text("status", {
      enum: ["pending", "accepted", "rejected"]
    }).default("pending").notNull(),
    reviewedBy: text("reviewedBy"),
    reviewedAt: integer("reviewedAt", { mode: "timestamp" }),
    reviewNotes: text("reviewNotes"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull().$onUpdate(() => /* @__PURE__ */ new Date())
  },
  (t2) => ({
    statusIdx: index("idx_pu_status").on(t2.status),
    adapterIdx: index("idx_pu_adapter").on(t2.adapter)
  })
);
var ingestionRuns = sqliteTable(
  "ingestion_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    adapter: text("adapter").notNull(),
    startedAt: integer("startedAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    finishedAt: integer("finishedAt", { mode: "timestamp" }),
    status: text("status", {
      enum: ["running", "succeeded", "failed", "partial"]
    }).default("running").notNull(),
    summary: text("summary", { mode: "json" }).$type(),
    errors: text("errors"),
    consecutiveFailures: integer("consecutiveFailures").default(0).notNull(),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
  },
  (t2) => ({
    adapterIdx: index("idx_ir_adapter").on(t2.adapter),
    startedAtIdx: index("idx_ir_startedAt").on(t2.startedAt)
  })
);
var rankingRuns = sqliteTable(
  "ranking_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    source: text("source").notNull(),
    category: text("category", {
      enum: ["text", "image", "video", "code", "audio", "other"]
    }).notNull(),
    pulledAt: integer("pulledAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull(),
    rawPayloadHash: text("rawPayloadHash").notNull(),
    appliedChanges: text("appliedChanges", { mode: "json" }).$type(),
    notes: text("notes"),
    createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(unixepoch())`).notNull()
  },
  (t2) => ({
    sourceCategoryIdx: index("idx_rr_source_category").on(t2.source, t2.category),
    pulledAtIdx: index("idx_rr_pulledAt").on(t2.pulledAt)
  })
);

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/db-client.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
var _client = null;
var _db = null;
function getDbClient() {
  if (_client) return _client;
  const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Local: `file:./local.db`. Prod: provisioned by Vercel/Turso integration as TURSO_DATABASE_URL."
    );
  }
  _client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN
  });
  return _client;
}
function getDb() {
  if (_db) return _db;
  _db = drizzle(getDbClient());
  return _db;
}

// server/db.ts
async function getDb2() {
  if (!process.env.DATABASE_URL && !process.env.TURSO_DATABASE_URL) return null;
  try {
    return getDb();
  } catch (err) {
    console.warn("[Database] Failed to connect:", err);
    return null;
  }
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb2();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = { openId: user.openId };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb2();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function createContribution(data) {
  const db = await getDb2();
  if (!db) {
    throw new Error("Database not available");
  }
  const rows = await db.insert(contributions).values(data).returning({ id: contributions.id });
  const id = rows[0]?.id;
  if (typeof id !== "number") {
    throw new Error("createContribution: could not determine insert id");
  }
  return id;
}
async function listContributions(limit = 50, offset = 0) {
  const db = await getDb2();
  if (!db) return [];
  return db.select().from(contributions).orderBy(desc(contributions.createdAt)).limit(limit).offset(offset);
}
async function getContributionById(id) {
  const db = await getDb2();
  if (!db) return void 0;
  const result = await db.select().from(contributions).where(eq(contributions.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateContributionStatus(id, status, adminNotes) {
  const db = await getDb2();
  if (!db) {
    throw new Error("Database not available");
  }
  const updateData = { status };
  if (adminNotes !== void 0) {
    updateData.adminNotes = adminNotes;
  }
  await db.update(contributions).set(updateData).where(eq(contributions.id, id));
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token2) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token2.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// lib/ingestion/storage.ts
import { eq as eq2, inArray, sql as sql2 } from "drizzle-orm";
var COMPARED_FIELDS = [
  "energyWh",
  "energyWhMin",
  "energyWhMax",
  "carbonGCO2e",
  "waterMl",
  "classification",
  "confidence",
  "sourceUrl",
  "sourceCitation",
  "hardware",
  "softwareVersion",
  "contextLength",
  "batchSize",
  "promptClass",
  "trainingOrInference",
  "compositeRank",
  "inTop20",
  "scaffold",
  "sweVerified",
  "swePro",
  "status",
  "statusNote",
  "vendor",
  "modelFamily",
  "modelVersion",
  "parameters",
  "openWeight",
  "utilityScore"
];
function diff(existing, proposed) {
  const out = [];
  for (const f of COMPARED_FIELDS) {
    const before = existing[f];
    const after = proposed[f];
    if (!isEqual(before, after)) {
      out.push({ field: f, from: before, to: after });
    }
  }
  return out;
}
function isEqual(a, b) {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 1e-9;
  }
  return false;
}
async function applyAdapterResults(adapterName, records) {
  const db = getDb();
  const result = { inserted: 0, pending: 0, unchanged: 0, errors: [] };
  if (records.length === 0) return result;
  const fps = Array.from(new Set(records.map((r) => r.sourceFingerprint)));
  const existing = await db.select().from(modelEnergyRecords).where(inArray(modelEnergyRecords.sourceFingerprint, fps));
  const byFp = /* @__PURE__ */ new Map();
  for (const row of existing) {
    byFp.set(row.sourceFingerprint, row);
  }
  for (const rec of records) {
    try {
      const current = byFp.get(rec.sourceFingerprint);
      if (!current) {
        const insert = {
          ...rec,
          lastVerifiedAt: /* @__PURE__ */ new Date()
        };
        await db.insert(modelEnergyRecords).values(insert);
        result.inserted++;
        continue;
      }
      const fieldDiffs = diff(current, rec);
      if (fieldDiffs.length === 0) {
        await db.update(modelEnergyRecords).set({ lastVerifiedAt: /* @__PURE__ */ new Date() }).where(eq2(modelEnergyRecords.id, current.id));
        result.unchanged++;
        continue;
      }
      const summary = fieldDiffs.map((d) => `${d.field}: ${JSON.stringify(d.from)} \u2192 ${JSON.stringify(d.to)}`).join(" | ");
      const pending = {
        sourceFingerprint: rec.sourceFingerprint,
        targetRecordId: current.id,
        adapter: adapterName,
        proposed: rec,
        current,
        diffSummary: summary,
        status: "pending"
      };
      await db.insert(pendingUpdates).values(pending);
      result.pending++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${rec.modelName} (${rec.category}): ${msg}`);
    }
  }
  return result;
}
async function openIngestionRun(adapter) {
  const db = getDb();
  const rows = await db.insert(ingestionRuns).values({ adapter, status: "running" }).returning({ id: ingestionRuns.id });
  const id = rows[0]?.id;
  if (typeof id !== "number") {
    throw new Error("openIngestionRun: could not determine insert id");
  }
  return id;
}
async function closeIngestionRun(id, result, consecutiveFailures) {
  const db = getDb();
  await db.update(ingestionRuns).set({
    finishedAt: /* @__PURE__ */ new Date(),
    status: result.status,
    summary: {
      inserted: result.inserted,
      pending: result.pending,
      unchanged: result.unchanged,
      errors: result.errors,
      durationMs: result.durationMs
    },
    errors: result.errors.length > 0 ? result.errors.join("\n") : null,
    consecutiveFailures
  }).where(eq2(ingestionRuns.id, id));
}
async function countConsecutiveFailures(adapter) {
  const db = getDb();
  const rows = await db.select({ status: ingestionRuns.status }).from(ingestionRuns).where(eq2(ingestionRuns.adapter, adapter)).orderBy(sql2`${ingestionRuns.startedAt} DESC`).limit(10);
  let streak = 0;
  for (const r of rows) {
    if (r.status === "failed") streak++;
    else break;
  }
  return streak;
}
function summarize(perAdapter, startedAt) {
  const totals = {
    inserted: 0,
    pending: 0,
    unchanged: 0,
    errors: 0
  };
  let succeeded = 0;
  let failed = 0;
  for (const r of perAdapter) {
    totals.inserted += r.inserted;
    totals.pending += r.pending;
    totals.unchanged += r.unchanged;
    totals.errors += r.errors.length;
    if (r.status === "succeeded" || r.status === "partial") succeeded++;
    else failed++;
  }
  return {
    startedAt: startedAt.toISOString(),
    finishedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalAdapters: perAdapter.length,
    succeededAdapters: succeeded,
    failedAdapters: failed,
    totals,
    perAdapter
  };
}

// lib/ingestion/adapters/benchlm.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// lib/ingestion/fingerprint.ts
import { createHash } from "node:crypto";
function makeFingerprint(args) {
  const date = args.measurementDate instanceof Date ? args.measurementDate : new Date(args.measurementDate);
  const dateIso = date.toISOString();
  const h = createHash("sha256");
  h.update(`${args.modelName}::${args.category}::${args.sourceName}::${dateIso}`);
  return h.digest("hex").slice(0, 32);
}
function firstOfMonth(d = /* @__PURE__ */ new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

// lib/ingestion/adapters/benchlm.ts
var SOURCE_NAME = "BenchLM";
var SOURCE_URL = "https://benchlm.com/";
function deriveTaskClass(cat) {
  switch (cat) {
    case "image":
      return "image_diffusion";
    case "video":
      return "video_generation";
    case "code":
      return "code_swe_task";
    default:
      return "text_generation";
  }
}
function deriveEnergyUnit(cat) {
  switch (cat) {
    case "image":
      return "wh_per_image";
    case "video":
      return "wh_per_video_second";
    case "code":
      return "wh_per_coding_task";
    default:
      return "wh_per_inference";
  }
}
function modelFamilyOf(name) {
  const l = name.toLowerCase();
  if (l.includes("claude")) return "Claude";
  if (l.includes("gpt") || l.includes("dall")) return "GPT";
  if (l.includes("gemini")) return "Gemini";
  if (l.includes("llama")) return "Llama";
  if (l.includes("qwen")) return "Qwen";
  if (l.includes("deepseek")) return "DeepSeek";
  if (l.includes("mistral") || l.includes("mixtral")) return "Mistral";
  if (l.includes("kimi")) return "Kimi";
  if (l.includes("glm")) return "GLM";
  if (l.includes("midjourney")) return "Midjourney";
  if (l.includes("flux")) return "Flux";
  if (l.includes("imagen")) return "Imagen";
  if (l.includes("veo")) return "Veo";
  if (l.includes("sora")) return "Sora";
  if (l.includes("stable diffusion")) return "Stable Diffusion";
  return name.split(/\s+/)[0] ?? name;
}
async function fetchLive() {
  throw new Error("benchlm: live HTTP not yet implemented (set USE_LIVE_HTTP=0 to use mock fixture)");
}
function fetchMock() {
  const fixturePath = resolve(process.cwd(), "lib/ingestion/fixtures/benchlm.json");
  const raw = readFileSync(fixturePath, "utf8");
  return JSON.parse(raw);
}
var benchlmAdapter = {
  name: "benchlm",
  coverage: ["text", "image", "video", "code"],
  description: "Primary capability + ranking source. Emits compositeRank, vendor, openWeight, scaffold, SWE-bench scores. No energy data.",
  async fetchAndNormalize() {
    const useLive = process.env.USE_LIVE_HTTP === "1";
    const rows = useLive ? await fetchLive() : fetchMock();
    const measurementDate = firstOfMonth();
    return rows.map((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME,
        measurementDate
      });
      return {
        modelName: r.modelName,
        modelFamily: modelFamilyOf(r.modelName),
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: r.openWeight,
        category: r.category,
        taskClass: deriveTaskClass(r.category),
        energyUnit: deriveEnergyUnit(r.category),
        // BenchLM is capability-only. Energy values are null here; the
        // energy adapters fill them in via separate rows.
        energyWh: null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,
        classification: "estimated",
        confidence: "low",
        sourceName: SOURCE_NAME,
        sourceUrl: SOURCE_URL,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions: null,
        compositeRank: r.rank,
        inTop20: r.rank <= 20,
        scaffold: r.scaffold ?? null,
        sweVerified: r.sweVerified ?? null,
        swePro: r.swePro ?? null,
        status: r.status ?? "active",
        statusNote: r.statusNote ?? null,
        utilityScore: null,
        notes: `Ingested from BenchLM on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/huggingface-energy-score.ts
import { readFileSync as readFileSync2 } from "node:fs";
import { resolve as resolve2 } from "node:path";
var SOURCE_NAME2 = "Hugging Face AI Energy Score";
var SOURCE_URL2 = "https://huggingface.co/spaces/EnergyStarAI/2024_leaderboard";
function deriveTaskClass2(c) {
  switch (c) {
    case "image":
      return "image_diffusion";
    case "code":
      return "code_swe_task";
    default:
      return "text_generation";
  }
}
function deriveEnergyUnit2(c) {
  switch (c) {
    case "image":
      return "wh_per_image";
    case "code":
      return "wh_per_coding_task";
    default:
      return "wh_per_inference";
  }
}
async function fetchLive2() {
  throw new Error("huggingface-energy-score: live HTTP not yet implemented");
}
function fetchMock2() {
  return JSON.parse(
    readFileSync2(resolve2(process.cwd(), "lib/ingestion/fixtures/huggingface-energy-score.json"), "utf8")
  );
}
var huggingfaceEnergyScoreAdapter = {
  name: "huggingface-energy-score",
  coverage: ["text", "image", "code"],
  description: "Hugging Face AI Energy Score leaderboard (Sasha Luccioni). Measured energy on H100.",
  async fetchAndNormalize() {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive2() : fetchMock2();
    return rows.map((r) => {
      const measurementDate = r.measurementDateIso ? new Date(r.measurementDateIso) : firstOfMonth();
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME2,
        measurementDate
      });
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: true,
        category: r.category,
        taskClass: deriveTaskClass2(r.category),
        energyUnit: deriveEnergyUnit2(r.category),
        energyWh: r.energyWh,
        energyWhMin: r.energyWhMin ?? null,
        energyWhMax: r.energyWhMax ?? null,
        carbonGCO2e: null,
        waterMl: null,
        classification: "measured",
        confidence: "medium",
        sourceName: SOURCE_NAME2,
        sourceUrl: SOURCE_URL2,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: r.hardware,
        softwareVersion: null,
        contextLength: r.contextLength ?? null,
        batchSize: r.batchSize ?? null,
        promptClass: "single_turn_chat",
        trainingOrInference: "inference",
        standardizedConditions: r.category === "image" ? { resolution: "1024x1024", steps: 30 } : null,
        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,
        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: `Ingested from Hugging Face AI Energy Score on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/ml-energy.ts
import { readFileSync as readFileSync3 } from "node:fs";
import { resolve as resolve3 } from "node:path";
var SOURCE_NAME3 = "ML.Energy";
var SOURCE_URL3 = "https://ml.energy/";
function deriveTaskClass3(c) {
  if (c === "image") return "image_diffusion";
  if (c === "video") return "video_generation";
  return "text_generation";
}
function deriveEnergyUnit3(c) {
  if (c === "image") return "wh_per_image";
  if (c === "video") return "wh_per_video_second";
  return "wh_per_inference";
}
async function fetchLive3() {
  throw new Error("ml-energy: live CSV fetch not yet implemented");
}
function fetchMock3() {
  return JSON.parse(
    readFileSync3(resolve3(process.cwd(), "lib/ingestion/fixtures/ml-energy.json"), "utf8")
  );
}
var mlEnergyAdapter = {
  name: "ml-energy",
  coverage: ["text", "image", "video"],
  description: "ML.Energy benchmark releases (CMU). Measured energy on H100.",
  async fetchAndNormalize() {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive3() : fetchMock3();
    const measurementDate = firstOfMonth();
    return rows.map((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME3,
        measurementDate
      });
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: true,
        category: r.category,
        taskClass: deriveTaskClass3(r.category),
        energyUnit: deriveEnergyUnit3(r.category),
        energyWh: r.energyWh,
        energyWhMin: r.energyWhMin ?? null,
        energyWhMax: r.energyWhMax ?? null,
        carbonGCO2e: r.carbonGCO2e ?? null,
        waterMl: r.waterMl ?? null,
        classification: "measured",
        confidence: "medium",
        sourceName: SOURCE_NAME3,
        sourceUrl: SOURCE_URL3,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: r.hardware,
        softwareVersion: null,
        contextLength: null,
        batchSize: r.batchSize ?? null,
        promptClass: "single_turn_chat",
        trainingOrInference: "inference",
        standardizedConditions: r.category === "image" ? { resolution: "1024x1024", steps: 30 } : r.category === "video" ? { resolution: "720p", duration_seconds: 5 } : null,
        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,
        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: `Ingested from ML.Energy on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/artificial-analysis.ts
import { readFileSync as readFileSync4 } from "node:fs";
import { resolve as resolve4 } from "node:path";
var SOURCE_NAME4 = "Artificial Analysis";
var SOURCE_URL4 = "https://artificialanalysis.ai/";
var REFERENCE_PRICE_PER_M_TOKENS_USD = 4;
var REFERENCE_WH_PER_TOKEN = 0.3 / 1e6;
var REFERENCE_WH_PER_IMAGE = 0.7685;
var REFERENCE_PRICE_PER_IMAGE_USD = 0.04;
var REFERENCE_WH_PER_VIDEO_SECOND = 30;
var REFERENCE_PRICE_PER_VIDEO_SECOND_USD = 0.5;
function deriveEnergyWh(r) {
  switch (r.category) {
    case "image":
      return r.pricePerUnitUsd / REFERENCE_PRICE_PER_IMAGE_USD * REFERENCE_WH_PER_IMAGE;
    case "video":
      return r.pricePerUnitUsd / REFERENCE_PRICE_PER_VIDEO_SECOND_USD * REFERENCE_WH_PER_VIDEO_SECOND;
    default: {
      const priceRatio = r.pricePerUnitUsd / REFERENCE_PRICE_PER_M_TOKENS_USD;
      const whPerToken = REFERENCE_WH_PER_TOKEN * priceRatio;
      return whPerToken * r.unitsPerInference;
    }
  }
}
function deriveTaskClass4(c) {
  if (c === "image") return "image_diffusion";
  if (c === "video") return "video_generation";
  return "text_generation";
}
function deriveEnergyUnit4(c) {
  if (c === "image") return "wh_per_image";
  if (c === "video") return "wh_per_video_second";
  return "wh_per_inference";
}
async function fetchLive4() {
  throw new Error("artificial-analysis: live HTTP not yet implemented");
}
function fetchMock4() {
  return JSON.parse(
    readFileSync4(resolve4(process.cwd(), "lib/ingestion/fixtures/artificial-analysis.json"), "utf8")
  );
}
var artificialAnalysisAdapter = {
  name: "artificial-analysis",
  coverage: ["text", "image", "video"],
  description: "Artificial Analysis pricing + throughput \u2192 derived energy. Pricing \xD7 reference cost/energy ratio per category.",
  async fetchAndNormalize() {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive4() : fetchMock4();
    const measurementDate = firstOfMonth();
    return rows.map((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME4,
        measurementDate
      });
      const wh = deriveEnergyWh(r);
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: false,
        category: r.category,
        taskClass: deriveTaskClass4(r.category),
        energyUnit: deriveEnergyUnit4(r.category),
        energyWh: wh,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,
        classification: "derived",
        confidence: "medium-low",
        sourceName: SOURCE_NAME4,
        sourceUrl: SOURCE_URL4,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: r.inferredHardware ?? null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: "single_turn_chat",
        trainingOrInference: "inference",
        standardizedConditions: null,
        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,
        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: `Derived from Artificial Analysis pricing on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}. Formula: pricePerUnit \xD7 (reference Wh / reference price).`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/lmarena.ts
import { readFileSync as readFileSync5 } from "node:fs";
import { resolve as resolve5 } from "node:path";
var SOURCE_NAME5 = "lmarena.ai";
var SOURCE_URL5 = "https://lmarena.ai/";
function deriveTaskClass5(c) {
  switch (c) {
    case "image":
      return "image_diffusion";
    case "video":
      return "video_generation";
    case "code":
      return "code_swe_task";
    default:
      return "text_generation";
  }
}
function deriveEnergyUnit5(c) {
  switch (c) {
    case "image":
      return "wh_per_image";
    case "video":
      return "wh_per_video_second";
    case "code":
      return "wh_per_coding_task";
    default:
      return "wh_per_inference";
  }
}
async function fetchLive5() {
  throw new Error("lmarena: live HTTP not yet implemented");
}
function fetchMock5() {
  return JSON.parse(
    readFileSync5(resolve5(process.cwd(), "lib/ingestion/fixtures/lmarena.json"), "utf8")
  );
}
var lmarenaAdapter = {
  name: "lmarena",
  coverage: ["text", "image", "video", "code"],
  description: "lmarena.ai Arena Elo across categories. Capability cross-check; no energy data.",
  async fetchAndNormalize() {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive5() : fetchMock5();
    const measurementDate = firstOfMonth();
    return rows.map((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME5,
        measurementDate
      });
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: r.openWeight ?? false,
        category: r.category,
        taskClass: deriveTaskClass5(r.category),
        energyUnit: deriveEnergyUnit5(r.category),
        energyWh: null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,
        classification: "estimated",
        confidence: "low",
        sourceName: SOURCE_NAME5,
        sourceUrl: SOURCE_URL5,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions: null,
        // We intentionally do NOT set compositeRank here — BenchLM is the
        // primary ranking source. We expose Arena Elo + rank via notes.
        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,
        status: "active",
        statusNote: null,
        utilityScore: `Arena Elo: ${r.arenaElo} (rank #${r.arenaRank} in ${r.category})`,
        notes: `Cross-check from lmarena.ai on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}. Arena Elo ${r.arenaElo}, rank #${r.arenaRank} in ${r.category} category.`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/swe-bench.ts
import { readFileSync as readFileSync6 } from "node:fs";
import { resolve as resolve6 } from "node:path";
var SOURCE_NAME6 = "SWE-bench Verified";
var SOURCE_URL6 = "https://www.swebench.com/";
async function fetchLive6() {
  throw new Error("swe-bench: live HTTP not yet implemented");
}
function fetchMock6() {
  return JSON.parse(
    readFileSync6(resolve6(process.cwd(), "lib/ingestion/fixtures/swe-bench.json"), "utf8")
  );
}
var sweBenchAdapter = {
  name: "swe-bench",
  coverage: ["code"],
  description: "SWE-bench Verified leaderboard scores. Code category only, capability cross-check.",
  async fetchAndNormalize() {
    const rows = process.env.USE_LIVE_HTTP === "1" ? await fetchLive6() : fetchMock6();
    const measurementDate = firstOfMonth();
    return rows.map((r) => {
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: "code",
        sourceName: SOURCE_NAME6,
        measurementDate
      });
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: null,
        openWeight: r.openWeight ?? false,
        category: "code",
        taskClass: "code_swe_task",
        energyUnit: "wh_per_coding_task",
        energyWh: null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,
        classification: "measured",
        confidence: "high",
        sourceName: SOURCE_NAME6,
        sourceUrl: SOURCE_URL6,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: "tool_use",
        trainingOrInference: "inference",
        standardizedConditions: { benchmark: "swe-bench", suite: "verified" },
        compositeRank: null,
        inTop20: false,
        scaffold: r.scaffold,
        sweVerified: r.sweVerified,
        swePro: r.swePro ?? null,
        status: "active",
        statusNote: null,
        utilityScore: `SWE-bench Verified: ${r.sweVerified}${r.swePro != null ? ` / Pro: ${r.swePro}` : ""}`,
        notes: `Ingested from SWE-bench Verified leaderboard on ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/system-cards.ts
import { existsSync, readFileSync as readFileSync7 } from "node:fs";
import { resolve as resolve7 } from "node:path";
import { parse as parseYaml } from "yaml";
var SOURCE_NAME7 = "Vendor system card";
var YAML_PATH = "data/system-cards.yaml";
function deriveTaskClass6(c) {
  switch (c) {
    case "image":
      return "image_diffusion";
    case "video":
      return "video_generation";
    case "code":
      return "code_swe_task";
    default:
      return "text_generation";
  }
}
function deriveEnergyUnit6(c) {
  switch (c) {
    case "image":
      return "wh_per_image";
    case "video":
      return "wh_per_video_second";
    case "code":
      return "wh_per_coding_task";
    default:
      return "wh_per_inference";
  }
}
var systemCardsAdapter = {
  name: "system-cards",
  coverage: ["text", "image", "video", "code"],
  description: "Manual: reads data/system-cards.yaml. Vendor-published system cards (OpenAI, Anthropic, Google, Meta).",
  async fetchAndNormalize() {
    const path = resolve7(process.cwd(), YAML_PATH);
    if (!existsSync(path)) {
      console.log(`[system-cards] ${YAML_PATH} not found \u2014 skipping with 0 records.`);
      return [];
    }
    const raw = readFileSync7(path, "utf8");
    const parsed = parseYaml(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    return parsed.map((r) => {
      const measurementDate = /* @__PURE__ */ new Date(`${r.publishedDate}T00:00:00Z`);
      const fp = makeFingerprint({
        modelName: r.modelName,
        category: r.category,
        sourceName: SOURCE_NAME7,
        measurementDate
      });
      const hasReported = r.reportedEnergyWh != null;
      const classification = hasReported ? "estimated" : "derived";
      const confidence = hasReported ? "medium-low" : "low";
      return {
        modelName: r.modelName,
        modelFamily: r.modelName.split(/[\s/-]/)[0] ?? r.modelName,
        modelVersion: null,
        vendor: r.vendor,
        parameters: r.parameters ?? null,
        openWeight: false,
        category: r.category,
        taskClass: deriveTaskClass6(r.category),
        energyUnit: deriveEnergyUnit6(r.category),
        energyWh: r.reportedEnergyWh ?? null,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: null,
        waterMl: null,
        classification,
        confidence,
        sourceName: SOURCE_NAME7,
        sourceUrl: r.systemCardUrl,
        sourceCitation: null,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: r.hardwareAssumption ?? null,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions: null,
        compositeRank: null,
        inTop20: false,
        scaffold: null,
        sweVerified: null,
        swePro: null,
        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: r.notes ?? `From ${r.vendor} system card published ${r.publishedDate}. Derivation: ${r.derivationMethod ?? "vendor-reported"}.`,
        sourceFingerprint: fp
      };
    });
  }
};

// lib/ingestion/adapters/aico2-estimator.ts
import { eq as eq3, isNotNull } from "drizzle-orm";

// lib/methodology/constants.ts
var METHODOLOGY_VERSION = "AICo2-v1.0-2026-04";
var TAU_TABLE = {
  text_chat: {
    tau: 1,
    confidence: "high",
    driver: "Token count, model size",
    notes: "Calibration baseline. FLOPs formula reliable."
  },
  text_reasoning: {
    tau: 24,
    // midpoint of 23-25× range
    confidence: "medium",
    driver: "Token inflation + KV cache pressure + batch degradation",
    notes: "Chain-of-thought / o1-class. Token inflation 10\xD7 \xD7 batch efficiency loss = 23\u201325\xD7 total."
  },
  text_agentic_moderate: {
    tau: 14,
    // midpoint of 13-15× range
    confidence: "medium-low",
    driver: "Sequential inference passes, token multiplication up to 15\xD7",
    notes: "Default for agentic workflows without test-time compute scaling."
  },
  text_agentic_test_time_scaled: {
    tau: 15,
    confidence: "low",
    driver: "Sequential passes + test-time compute multiplication",
    notes: "15\xD7 the chat baseline yields ~4.32 Wh (matching the agentic-AI legacy figure)."
  },
  image_standard_25step: {
    tau: 20,
    confidence: "high",
    driver: "Denoising step count and resolution",
    notes: "Architecturally distinct from LLMs; FLOPs formula does not directly apply. Use reference Wh value."
  },
  image_high_quality_50step: {
    tau: 39,
    confidence: "high",
    driver: "Step doubling with non-linear resolution cost",
    notes: "2\xD7 step increase produces ~1.95\xD7 energy (sublinear due to finer gradient resolution)."
  },
  video_short_5s: {
    tau: 3e4,
    confidence: "medium",
    driver: "3D self-attention quadratic cost, temporal denoising",
    notes: "5-second clip at 24fps = ~120 frames. Empirically measured. Warrants separate reporting class."
  }
};
var REFERENCE_WH_PER_RESPONSE = {
  text_chat: 0.032,
  // 8B chat model baseline (Wh)
  text_reasoning: 0.755,
  // midpoint of 0.72-0.79 Wh
  text_agentic_moderate: 0.86,
  // midpoint of 0.42-1.30 Wh
  text_agentic_test_time_scaled: 4.32,
  // 15× test-time scaled
  image_standard_25step: 0.63,
  image_high_quality_50step: 1.22,
  video_short_5s: 944
};
var WH_PER_1K_TOKENS_BY_HARDWARE = {
  H100: 0.04,
  H200: 0.037,
  B200: 28e-4,
  TPU_v5: 0.034,
  Unknown: 0.04
};
var FACILITY_TABLE = {
  hyperscale_modern: {
    f: 1.13,
    fMin: 1.08,
    fMax: 1.18,
    pue: 1.1,
    gpuShare: "85\u201393%"
  },
  hyperscale_standard: {
    f: 1.4,
    fMin: 1.25,
    fMax: 1.54,
    pue: 1.3,
    gpuShare: "65\u201380%"
  },
  enterprise: {
    f: 1.77,
    fMin: 1.54,
    fMax: 2,
    pue: 1.55,
    gpuShare: "50\u201365%"
  },
  legacy: {
    f: 2.2,
    fMin: 2,
    fMax: 2.5,
    pue: 1.8,
    gpuShare: "<50%"
  },
  unknown: {
    // Default per Section 4.1 Stage 4: "Default F = 1.54 ... unless
    // facility class is known. ... global average PUE (~1.55)."
    f: 1.54,
    fMin: 1.25,
    fMax: 2,
    pue: 1.55,
    gpuShare: "unknown"
  }
};
var VIDEO_F_SUPPLEMENT = 1.15;
var US_2024_GRID_INTENSITY_G_CO2E_PER_KWH = 402.49;
var INDUSTRY_AVERAGE_WUE_L_PER_KWH = 1.9;
var TIER_PARAMETERS_B = {
  small: 8,
  // 8B
  mid: 70,
  // 70B
  large: 405,
  // 405B
  frontier: 1e3
  // 1T (closed frontier models, working assumption)
};
var MODEL_PARAMETER_OVERRIDES = {
  // Open-weight (disclosed)
  "Llama 3.1 8B": { N_B: 8, source: "disclosed" },
  "Llama 3.1 70B": { N_B: 70, source: "disclosed" },
  "Llama 3.1 405B": { N_B: 405, source: "disclosed" },
  "Llama 4 Scout": { N_B: 109, source: "disclosed" },
  "Mixtral 8x22B": { N_B: 141, source: "disclosed" },
  // MoE total
  "Qwen2-72B-Instruct": { N_B: 72, source: "disclosed" },
  "Qwen 3.6 Plus": { N_B: 235, source: "tier-estimate" },
  "Qwen 3.5 0.8B": { N_B: 0.8, source: "disclosed" },
  "DeepSeek V3.2": { N_B: 671, source: "disclosed" },
  "DeepSeek V4 Pro Max": { N_B: 1e3, source: "tier-estimate" },
  "GLM-4.7": { N_B: 32, source: "tier-estimate" },
  "GLM-5": { N_B: 200, source: "tier-estimate" },
  "Mistral Medium 3.5": { N_B: 80, source: "tier-estimate" },
  "OLMo 3.1": { N_B: 32, source: "tier-estimate" },
  "Kimi K2.5": { N_B: 1e3, source: "tier-estimate" },
  "Kimi K2.6": { N_B: 1e3, source: "tier-estimate" },
  "MiniMax M2.5": { N_B: 456, source: "tier-estimate" },
  "BLOOM": { N_B: 176, source: "disclosed" },
  "LLaMA": { N_B: 65, source: "disclosed" },
  // Closed frontier (tier estimates)
  "GPT-4o": { N_B: 200, source: "tier-estimate" },
  "GPT-4.1": { N_B: 1e3, source: "tier-estimate" },
  "GPT-4.5": { N_B: 2e3, source: "tier-estimate" },
  "GPT-o3": { N_B: 1e3, source: "tier-estimate" },
  "GPT-5.3": { N_B: 1500, source: "tier-estimate" },
  "GPT-5.5": { N_B: 1800, source: "tier-estimate" },
  "GPT-5.3-Codex": { N_B: 1500, source: "tier-estimate" },
  "Claude Opus 4.6": { N_B: 1e3, source: "tier-estimate" },
  "Claude Opus 4.6 Thinking": { N_B: 1e3, source: "tier-estimate" },
  "Claude Opus 4.7": { N_B: 1200, source: "tier-estimate" },
  "Claude Sonnet 4.6": { N_B: 400, source: "tier-estimate" },
  "Claude Mythos Preview": { N_B: 1500, source: "tier-estimate" },
  "Gemini 3.1 Pro": { N_B: 1500, source: "tier-estimate" },
  "Grok 4": { N_B: 1500, source: "tier-estimate" }
};
var DEFAULT_TOKENS_PER_INFERENCE = {
  text_chat: 717,
  // ML.Energy mean for standard chat (Section 5.3)
  text_reasoning: 6988,
  // ML.Energy mean for reasoning (Section 5.3)
  text_agentic_moderate: 6e3,
  text_agentic_test_time_scaled: 12e3,
  image_standard_25step: 0,
  // tokens irrelevant for image
  image_high_quality_50step: 0,
  video_short_5s: 0
};

// lib/methodology/aico2.ts
function lookupParametersB(modelName, fallbackTier = "mid") {
  const override = MODEL_PARAMETER_OVERRIDES[modelName];
  if (override) return override;
  return { N_B: TIER_PARAMETERS_B[fallbackTier], source: "tier-fallback" };
}
function pickTaskClassKey(args) {
  const { category, taskClass, scaffold, denoisingSteps } = args;
  if (category === "video") return "video_short_5s";
  if (category === "image") {
    if (denoisingSteps && denoisingSteps >= 40) return "image_high_quality_50step";
    return "image_standard_25step";
  }
  if (category === "code") {
    if (scaffold && scaffold.toLowerCase() !== "open") {
      return "text_agentic_test_time_scaled";
    }
    return "text_agentic_moderate";
  }
  if (taskClass === "reasoning") return "text_reasoning";
  if (taskClass === "agentic_workflow") return "text_agentic_moderate";
  return "text_chat";
}
function lookupTau(key) {
  return TAU_TABLE[key].tau;
}
function classifyHardware(hardware) {
  if (!hardware) return "Unknown";
  const h = hardware.toUpperCase();
  if (h.includes("H200")) return "H200";
  if (h.includes("B200")) return "B200";
  if (h.includes("H100")) return "H100";
  if (h.includes("TPU")) return "TPU_v5";
  return "Unknown";
}
function classifyFacility(vendor) {
  if (!vendor) return "unknown";
  const v = vendor.toLowerCase();
  if (["google", "openai", "anthropic", "microsoft", "meta", "amazon", "xai"].some((x) => v.includes(x))) {
    return "hyperscale_modern";
  }
  if (["alibaba", "tencent", "bytedance", "kuaishou"].some((x) => v.includes(x))) {
    return "hyperscale_standard";
  }
  return "unknown";
}
function estimateEnergy(input) {
  const taskClassKey = pickTaskClassKey(input);
  const tau = lookupTau(taskClassKey);
  const hardwareClass = classifyHardware(input.hardware);
  const facilityClass = classifyFacility(input.vendor);
  const facility = FACILITY_TABLE[facilityClass];
  let fApplied = facility.f;
  if (input.category === "video") fApplied *= VIDEO_F_SUPPLEMENT;
  const pueApplied = facility.pue;
  let energyWh;
  let parametersB = 0;
  let parametersBSource = "tier-fallback";
  let tokensUsed = 0;
  let derivation;
  if (input.category === "image" || input.category === "video") {
    const refWh = REFERENCE_WH_PER_RESPONSE[taskClassKey];
    energyWh = refWh * (fApplied / 2) * pueApplied;
    derivation = `${input.category === "video" ? "Video" : "Image"} reference ${refWh} Wh (${taskClassKey}, \u03C4=${tau} encapsulated) \xD7 facility F/2 (${(fApplied / 2).toFixed(2)}) \xD7 PUE (${pueApplied})`;
  } else {
    const paramLookup = lookupParametersB(input.modelName);
    parametersB = paramLookup.N_B;
    parametersBSource = paramLookup.source;
    tokensUsed = input.tokens ?? DEFAULT_TOKENS_PER_INFERENCE[taskClassKey];
    const whPer1k = WH_PER_1K_TOKENS_BY_HARDWARE[hardwareClass];
    const sizeScaling = parametersB / 70;
    const energyIT_Wh = sizeScaling * (tokensUsed / 1e3) * whPer1k * tau;
    energyWh = energyIT_Wh * fApplied * pueApplied;
    derivation = `${parametersB}B params (${paramLookup.source}) \xD7 ${tokensUsed} tokens \xD7 ${whPer1k} Wh/1k (${hardwareClass}) \xD7 \u03C4 (${tau}) \xD7 F (${fApplied.toFixed(2)}) \xD7 PUE (${pueApplied})`;
  }
  return {
    energyWh,
    tauApplied: tau,
    fApplied,
    pueApplied,
    hardwareClass,
    facilityClass,
    taskClassKey,
    parametersBSource,
    parametersB,
    tokensUsed,
    derivation,
    methodologyVersion: METHODOLOGY_VERSION
  };
}
function computeCarbonGCO2e(energyWh, gridIntensityGCO2ePerKWh = US_2024_GRID_INTENSITY_G_CO2E_PER_KWH) {
  return energyWh / 1e3 * gridIntensityGCO2ePerKWh;
}
function computeWaterMl(energyWh, wueLPerKWh = INDUSTRY_AVERAGE_WUE_L_PER_KWH) {
  return energyWh * wueLPerKWh;
}
function deriveDownstream(energyWh, gridIntensity = US_2024_GRID_INTENSITY_G_CO2E_PER_KWH, wue = INDUSTRY_AVERAGE_WUE_L_PER_KWH) {
  return {
    carbonGCO2e: computeCarbonGCO2e(energyWh, gridIntensity),
    waterMl: computeWaterMl(energyWh, wue),
    gridIntensityGCO2ePerKWh: gridIntensity,
    wueLPerKWh: wue,
    methodologyVersion: METHODOLOGY_VERSION,
    derivation: `Carbon = ${energyWh.toFixed(4)} Wh \xD7 ${gridIntensity} gCO\u2082e/kWh \xF7 1000. Water = ${energyWh.toFixed(4)} Wh \xD7 ${wue} L/kWh.`
  };
}

// lib/ingestion/adapters/aico2-estimator.ts
var SOURCE_NAME8 = "M\u0101lama AICo2 (estimated)";
var SOURCE_URL7 = "https://aipower.fyi/methodology";
async function findGapPairs() {
  const db = getDb();
  const all = await db.select().from(modelEnergyRecords);
  const groups = /* @__PURE__ */ new Map();
  for (const row of all) {
    const key = `${row.modelName}::${row.category}`;
    const g = groups.get(key);
    if (g) {
      g.rows.push(row);
      if (row.energyWh != null) g.hasEnergy = true;
    } else {
      groups.set(key, { rows: [row], hasEnergy: row.energyWh != null });
    }
  }
  const primary = /* @__PURE__ */ new Set(["text", "image", "video", "code", "audio"]);
  const gaps = [];
  for (const group of Array.from(groups.values())) {
    if (group.hasEnergy) continue;
    const seed = group.rows[0];
    if (!primary.has(seed.category)) continue;
    gaps.push({
      modelName: seed.modelName,
      category: seed.category,
      taskClass: seed.taskClass,
      vendor: seed.vendor,
      parameters: seed.parameters,
      scaffold: seed.scaffold,
      openWeight: seed.openWeight,
      compositeRank: seed.compositeRank,
      inTop20: seed.inTop20
    });
  }
  return gaps;
}
function deriveEnergyUnit7(category) {
  switch (category) {
    case "image":
      return "wh_per_image";
    case "video":
      return "wh_per_video_second";
    case "code":
      return "wh_per_coding_task";
    default:
      return "wh_per_inference";
  }
}
function deriveTaskClass7(category) {
  switch (category) {
    case "image":
      return "image_diffusion";
    case "video":
      return "video_generation";
    case "code":
      return "code_swe_task";
    case "audio":
      return "audio_asr";
    default:
      return "text_generation";
  }
}
function resolveTaskClass(category, seedTaskClass) {
  if (seedTaskClass === "reasoning" || seedTaskClass === "agentic_workflow" || seedTaskClass === "translation" || seedTaskClass === "classification" || seedTaskClass === "detection") {
    return seedTaskClass;
  }
  return deriveTaskClass7(category);
}
var aico2EstimatorAdapter = {
  name: "aico2-estimator",
  coverage: ["text", "image", "video", "code"],
  description: "M\u0101lama AICo2 Methodology Phase 1 estimator. Fills energy gaps using FLOPs \xD7 \u03C4 \xD7 hardware \xD7 facility \xD7 PUE. Always runs LAST.",
  async fetchAndNormalize() {
    const gaps = await findGapPairs();
    console.log(`[aico2-estimator] Found ${gaps.length} (model, category) pairs missing energy data.`);
    const measurementDate = firstOfMonth();
    const records = [];
    for (const gap of gaps) {
      if (gap.category === "other") continue;
      if (gap.category === "audio") continue;
      const estimate = estimateEnergy({
        modelName: gap.modelName,
        category: gap.category,
        taskClass: gap.taskClass,
        scaffold: gap.scaffold,
        vendor: gap.vendor
      });
      const downstream = deriveDownstream(
        estimate.energyWh,
        US_2024_GRID_INTENSITY_G_CO2E_PER_KWH,
        INDUSTRY_AVERAGE_WUE_L_PER_KWH
      );
      const tauConfidence = TAU_TABLE[estimate.taskClassKey].confidence;
      const fp = makeFingerprint({
        modelName: gap.modelName,
        category: gap.category,
        sourceName: SOURCE_NAME8,
        measurementDate
      });
      records.push({
        modelName: gap.modelName,
        modelFamily: gap.modelName.split(/[\s/-]/)[0] ?? gap.modelName,
        modelVersion: null,
        vendor: gap.vendor,
        parameters: gap.parameters ?? `${estimate.parametersB}B (${estimate.parametersBSource})`,
        openWeight: gap.openWeight,
        category: gap.category,
        taskClass: resolveTaskClass(gap.category, gap.taskClass),
        energyUnit: deriveEnergyUnit7(gap.category),
        energyWh: estimate.energyWh,
        energyWhMin: null,
        energyWhMax: null,
        carbonGCO2e: downstream.carbonGCO2e,
        waterMl: downstream.waterMl,
        classification: "estimated",
        confidence: tauConfidence,
        sourceName: SOURCE_NAME8,
        sourceUrl: SOURCE_URL7,
        sourceCitation: `M\u0101lama AICo2 Methodology Green Paper v1.0 (2026-04). Derivation: ${estimate.derivation}.`,
        measurementDate,
        lastVerifiedAt: /* @__PURE__ */ new Date(),
        hardware: estimate.hardwareClass === "Unknown" ? null : estimate.hardwareClass,
        softwareVersion: null,
        contextLength: null,
        batchSize: null,
        promptClass: null,
        trainingOrInference: "inference",
        standardizedConditions: gap.category === "image" ? { resolution: "1024x1024", steps: 25 } : gap.category === "video" ? { resolution: "720p", duration_seconds: 5 } : gap.category === "code" ? { benchmark: "swe-bench", suite: "verified" } : null,
        // Preserve ranking from the seed row.
        compositeRank: gap.compositeRank,
        inTop20: gap.inTop20,
        scaffold: gap.scaffold,
        sweVerified: null,
        swePro: null,
        status: "active",
        statusNote: null,
        utilityScore: null,
        notes: `AICo2 v1.0 estimate. Task class: ${estimate.taskClassKey}. Parameters: ${estimate.parametersB}B (${estimate.parametersBSource}). ${estimate.derivation}. ${downstream.derivation}`,
        // AICo2 audit fields
        tauApplied: estimate.tauApplied,
        fApplied: estimate.fApplied,
        pueApplied: estimate.pueApplied,
        gridIntensityGCO2ePerKWh: downstream.gridIntensityGCO2ePerKWh,
        wueLPerKWh: downstream.wueLPerKWh,
        facilityClass: estimate.facilityClass,
        hardwareClass: estimate.hardwareClass,
        methodologyVersion: METHODOLOGY_VERSION,
        energyWhP10: null,
        energyWhP90: null,
        carbonGCO2eP10: null,
        carbonGCO2eP90: null,
        waterMlP10: null,
        waterMlP90: null,
        sourceFingerprint: fp
      });
    }
    return records;
  }
};

// lib/ingestion/run.ts
var ADAPTERS = [
  benchlmAdapter,
  huggingfaceEnergyScoreAdapter,
  mlEnergyAdapter,
  artificialAnalysisAdapter,
  lmarenaAdapter,
  sweBenchAdapter,
  systemCardsAdapter,
  aico2EstimatorAdapter
];
var ADAPTERS_BY_NAME = new Map(ADAPTERS.map((a) => [a.name, a]));
async function runSingleAdapter(adapter) {
  const t0 = Date.now();
  const runId = await openIngestionRun(adapter.name);
  let result;
  try {
    const records = await adapter.fetchAndNormalize();
    const applied = await applyAdapterResults(adapter.name, records);
    result = {
      adapter: adapter.name,
      status: applied.errors.length === 0 ? "succeeded" : "partial",
      inserted: applied.inserted,
      pending: applied.pending,
      unchanged: applied.unchanged,
      errors: applied.errors,
      durationMs: Date.now() - t0
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result = {
      adapter: adapter.name,
      status: "failed",
      inserted: 0,
      pending: 0,
      unchanged: 0,
      errors: [msg],
      durationMs: Date.now() - t0
    };
  }
  const streak = result.status === "failed" ? await countConsecutiveFailures(adapter.name) + 1 : 0;
  await closeIngestionRun(runId, result, streak);
  console.log(
    `[ingest] ${adapter.name}: status=${result.status} inserted=${result.inserted} pending=${result.pending} unchanged=${result.unchanged} errors=${result.errors.length} ${result.durationMs}ms`
  );
  if (streak >= 3) {
    console.warn(`[ingest] \u26A0 ${adapter.name} has failed ${streak} consecutive runs \u2014 admin attention required.`);
  }
  return result;
}
async function runAll() {
  const startedAt = /* @__PURE__ */ new Date();
  const perAdapter = [];
  for (const adapter of ADAPTERS) {
    perAdapter.push(await runSingleAdapter(adapter));
  }
  return summarize(perAdapter, startedAt);
}
async function runOne(name) {
  const adapter = ADAPTERS_BY_NAME.get(name);
  if (!adapter) {
    throw new Error(`Unknown adapter: ${name}. Known: ${Array.from(ADAPTERS_BY_NAME.keys()).join(", ")}`);
  }
  const startedAt = /* @__PURE__ */ new Date();
  const result = await runSingleAdapter(adapter);
  return summarize([result], startedAt);
}

// server/_core/ingest.ts
var ADMIN_KEY_HEADER = "x-admin-key";
function isAuthorized(req) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return false;
  }
  const provided = req.header(ADMIN_KEY_HEADER);
  if (!provided) return false;
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}
function registerIngestRoutes(app2) {
  app2.post("/api/ingest/run", async (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized. Set ADMIN_KEY and pass X-Admin-Key header." });
      return;
    }
    const adapterParam = typeof req.query.adapter === "string" ? req.query.adapter : null;
    try {
      const summary = adapterParam ? await runOne(adapterParam) : await runAll();
      res.json({ ok: true, summary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ ok: false, error: msg });
    }
  });
  app2.get("/api/ingest/adapters", (req, res) => {
    if (!isAuthorized(req)) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    res.json({
      adapters: ADAPTERS.map((a) => ({
        name: a.name,
        coverage: a.coverage,
        description: a.description
      }))
    });
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { and, desc as desc2, eq as eq5, sql as sql3 } from "drizzle-orm";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);
var adminKeyProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (ctx.user && ctx.user.role === "admin") {
      return next({ ctx: { ...ctx, user: ctx.user } });
    }
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
    throw new TRPCError2({
      code: "FORBIDDEN",
      message: "Admin role or X-Admin-Key header required."
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/sanity.ts
import { createClient as createClient2 } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
var projectId = process.env.SANITY_PROJECT_ID || "";
var dataset = process.env.SANITY_DATASET || "production";
var token = process.env.SANITY_API_TOKEN || "";
var SANITY_DISABLED = !projectId;
if (SANITY_DISABLED) {
  console.warn(
    "[sanity] SANITY_PROJECT_ID not set \u2014 running with stub client. CMS queries will return null and the UI will fall back to hardcoded defaults."
  );
}
function makeStubClient() {
  const stub = {
    fetch: async () => null,
    config: () => ({ projectId, dataset })
  };
  return stub;
}
var sanityClient = SANITY_DISABLED ? makeStubClient() : createClient2({
  projectId,
  dataset,
  token,
  useCdn: false,
  // Server-side: always fresh data
  apiVersion: "2024-01-01"
});
var sanityPublicClient = SANITY_DISABLED ? makeStubClient() : createClient2({
  projectId,
  dataset,
  useCdn: true,
  apiVersion: "2024-01-01"
});
var builder = SANITY_DISABLED ? null : imageUrlBuilder(sanityClient);

// server/sanity-schemas.ts
var QUERIES = {
  // Blog posts
  allPosts: `*[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, category, tags, publishedAt, featured, author,
    "coverImageUrl": coverImage.asset->url
  }`,
  featuredPosts: `*[_type == "blogPost" && featured == true] | order(publishedAt desc)[0...3] {
    _id, title, slug, excerpt, category, tags, publishedAt, author,
    "coverImageUrl": coverImage.asset->url
  }`,
  postBySlug: `*[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, excerpt, body, category, tags, publishedAt, featured, author,
    "coverImageUrl": coverImage.asset->url
  }`,
  postsByCategory: `*[_type == "blogPost" && category == $category] | order(publishedAt desc) {
    _id, title, slug, excerpt, category, tags, publishedAt, author,
    "coverImageUrl": coverImage.asset->url
  }`,
  // NOTE: allModels / modelsByCategory GROQ queries removed in Phase 3b.
  // AI model data now lives in MySQL (model_energy_records) and is
  // served via cms.modelsForDashboard.
  // Team
  allTeamMembers: `*[_type == "teamMember"] | order(order asc) {
    _id, name, role, bio, linkedin, twitter, website, order,
    "photoUrl": photo.asset->url
  }`,
  // Site Settings
  siteSettings: `*[_type == "siteSettings"][0] {
    heroTitle, heroHighlight, heroDescription,
    ctaExploreLabel, ctaMethodologyLabel, ctaAgentsLabel, ctaPaperLabel, ctaPaperUrl,
    aboutText, footerTagline, contactEmail, socialLinks
  }`
};

// lib/dashboard/models.ts
import { eq as eq4 } from "drizzle-orm";
var CLASSIFICATION_RANK = {
  measured: 3,
  derived: 2,
  estimated: 1
};
var CONFIDENCE_RANK = {
  high: 4,
  medium: 3,
  "medium-low": 2,
  low: 1
};
function score(row) {
  const classScore = (CLASSIFICATION_RANK[row.classification] ?? 0) * 1e6;
  const confScore = (CONFIDENCE_RANK[row.confidence] ?? 0) * 1e5;
  const verified = row.lastVerifiedAt instanceof Date ? row.lastVerifiedAt.getTime() : 0;
  const verifiedScore = Math.floor(verified / 1e3) % 1e5;
  return classScore + confScore + verifiedScore;
}
function pickAndMerge(group) {
  const sorted = [...group].sort((a, b) => score(b) - score(a));
  const primary = sorted[0];
  function bestOf(field) {
    for (const r of sorted) {
      const v = r[field];
      if (v !== null && v !== void 0) return v;
    }
    return null;
  }
  return {
    ...primary,
    // Always prefer ranking-bearing row if any exists.
    compositeRank: bestOf("compositeRank") ?? primary.compositeRank,
    inTop20: group.some((r) => r.inTop20) || primary.inTop20,
    // Energy / measurement data: take the best non-null.
    energyWh: bestOf("energyWh") ?? primary.energyWh,
    energyWhMin: bestOf("energyWhMin") ?? primary.energyWhMin,
    energyWhMax: bestOf("energyWhMax") ?? primary.energyWhMax,
    carbonGCO2e: bestOf("carbonGCO2e") ?? primary.carbonGCO2e,
    waterMl: bestOf("waterMl") ?? primary.waterMl,
    hardware: bestOf("hardware") ?? primary.hardware,
    softwareVersion: bestOf("softwareVersion") ?? primary.softwareVersion,
    contextLength: bestOf("contextLength") ?? primary.contextLength,
    batchSize: bestOf("batchSize") ?? primary.batchSize,
    standardizedConditions: bestOf("standardizedConditions") ?? primary.standardizedConditions,
    // Code-specific
    scaffold: bestOf("scaffold") ?? primary.scaffold,
    sweVerified: bestOf("sweVerified") ?? primary.sweVerified,
    swePro: bestOf("swePro") ?? primary.swePro,
    // Identity additions
    vendor: primary.vendor || bestOf("vendor") || "Unknown",
    openWeight: group.some((r) => r.openWeight) || primary.openWeight,
    parameters: bestOf("parameters") ?? primary.parameters,
    utilityScore: bestOf("utilityScore") ?? primary.utilityScore,
    // AICo2 audit fields — take from the highest-scoring row that has them.
    tauApplied: bestOf("tauApplied") ?? primary.tauApplied,
    fApplied: bestOf("fApplied") ?? primary.fApplied,
    pueApplied: bestOf("pueApplied") ?? primary.pueApplied,
    gridIntensityGCO2ePerKWh: bestOf("gridIntensityGCO2ePerKWh") ?? primary.gridIntensityGCO2ePerKWh,
    wueLPerKWh: bestOf("wueLPerKWh") ?? primary.wueLPerKWh,
    facilityClass: bestOf("facilityClass") ?? primary.facilityClass,
    hardwareClass: bestOf("hardwareClass") ?? primary.hardwareClass,
    methodologyVersion: bestOf("methodologyVersion") ?? primary.methodologyVersion
  };
}
async function getDashboardModels() {
  const db = getDb();
  const allRows = await db.select().from(modelEnergyRecords);
  const live = allRows.filter((r) => r.status !== "deprecated");
  const groups = /* @__PURE__ */ new Map();
  for (const r of live) {
    const key = `${r.modelName}::${r.category}`;
    const g = groups.get(key);
    if (g) g.push(r);
    else groups.set(key, [r]);
  }
  const deduped = [];
  for (const group of Array.from(groups.values())) {
    deduped.push(pickAndMerge(group));
  }
  deduped.sort((a, b) => {
    if (a.inTop20 !== b.inTop20) return a.inTop20 ? -1 : 1;
    const ar = a.compositeRank ?? Number.MAX_SAFE_INTEGER;
    const br = b.compositeRank ?? Number.MAX_SAFE_INTEGER;
    if (ar !== br) return ar - br;
    return a.modelName.localeCompare(b.modelName);
  });
  return {
    rows: deduped,
    totalRowCount: allRows.length,
    dedupedRowCount: deduped.length
  };
}

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
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
    postBySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ input }) => {
      return sanityClient.fetch(QUERIES.postBySlug, { slug: input.slug });
    }),
    /** Public: get posts by category */
    postsByCategory: publicProcedure.input(z2.object({ category: z2.string() })).query(async ({ input }) => {
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
    })
  }),
  contributions: router({
    /** Public: submit a new contribution (no auth required) */
    submit: publicProcedure.input(
      z2.object({
        name: z2.string().min(1, "Name is required").max(255),
        email: z2.string().email("Valid email is required").max(320),
        organization: z2.string().max(255).optional(),
        contributionType: z2.enum([
          "new_model_data",
          "correction",
          "methodology",
          "sensor_data",
          "other"
        ]),
        message: z2.string().min(10, "Please provide at least 10 characters").max(5e3),
        dataUrl: z2.string().url().max(2e3).optional().or(z2.literal(""))
      })
    ).mutation(async ({ input }) => {
      const id = await createContribution({
        name: input.name,
        email: input.email,
        organization: input.organization ?? null,
        contributionType: input.contributionType,
        message: input.message,
        dataUrl: input.dataUrl || null
      });
      const typeLabels = {
        new_model_data: "New Model Data",
        correction: "Data Correction",
        methodology: "Methodology Improvement",
        sensor_data: "Sensor Data",
        other: "Other"
      };
      await notifyOwner({
        title: `New Contribution: ${typeLabels[input.contributionType] ?? input.contributionType}`,
        content: [
          `**From:** ${input.name} (${input.email})`,
          input.organization ? `**Organization:** ${input.organization}` : "",
          `**Type:** ${typeLabels[input.contributionType] ?? input.contributionType}`,
          `**Message:** ${input.message.slice(0, 500)}${input.message.length > 500 ? "..." : ""}`,
          input.dataUrl ? `**Data URL:** ${input.dataUrl}` : ""
        ].filter(Boolean).join("\n")
      }).catch((err) => {
        console.warn("[Contributions] Failed to notify owner:", err);
      });
      return { success: true, id };
    }),
    /** Admin: list all contributions with pagination */
    list: adminProcedure.input(
      z2.object({
        limit: z2.number().min(1).max(100).default(50),
        offset: z2.number().min(0).default(0)
      }).optional()
    ).query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      return listContributions(limit, offset);
    }),
    /** Admin: get a single contribution by ID */
    getById: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getContributionById(input.id);
    }),
    /** Admin: update the status of a contribution */
    updateStatus: adminProcedure.input(
      z2.object({
        id: z2.number(),
        status: z2.enum(["pending", "reviewed", "accepted", "rejected"]),
        adminNotes: z2.string().max(2e3).optional()
      })
    ).mutation(async ({ input }) => {
      await updateContributionStatus(input.id, input.status, input.adminNotes);
      return { success: true };
    })
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
        description: a.description
      }));
    }),
    /** Run all adapters now. Returns the RunSummary. */
    runAll: adminKeyProcedure.mutation(async () => {
      return await runAll();
    }),
    /** Run a single adapter by name. */
    runOne: adminKeyProcedure.input(z2.object({ adapter: z2.string().min(1).max(64) })).mutation(async ({ input }) => {
      return await runOne(input.adapter);
    }),
    /** Recent ingestion run history (latest first). */
    runs: adminKeyProcedure.input(
      z2.object({
        limit: z2.number().min(1).max(200).default(50),
        adapter: z2.string().min(1).max(64).optional()
      }).optional()
    ).query(async ({ input }) => {
      const db = getDb();
      const limit = input?.limit ?? 50;
      if (input?.adapter) {
        return db.select().from(ingestionRuns).where(eq5(ingestionRuns.adapter, input.adapter)).orderBy(desc2(ingestionRuns.startedAt)).limit(limit);
      }
      return db.select().from(ingestionRuns).orderBy(desc2(ingestionRuns.startedAt)).limit(limit);
    }),
    /** Adapter health: count consecutive failures, flag >=3 streak. */
    health: adminKeyProcedure.query(async () => {
      const db = getDb();
      const allRuns = await db.select().from(ingestionRuns).orderBy(desc2(ingestionRuns.startedAt)).limit(500);
      const byAdapter = /* @__PURE__ */ new Map();
      for (const run of allRuns) {
        const entry = byAdapter.get(run.adapter);
        if (!entry) {
          byAdapter.set(run.adapter, {
            lastStatus: run.status,
            streak: run.status === "failed" ? 1 : 0,
            lastRun: run.startedAt
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
          needsAttention: (entry?.streak ?? 0) >= 3
        };
      });
    })
  }),
  pending: router({
    /** List pending updates awaiting human review. */
    list: adminKeyProcedure.input(
      z2.object({
        status: z2.enum(["pending", "accepted", "rejected"]).default("pending"),
        limit: z2.number().min(1).max(200).default(50)
      }).optional()
    ).query(async ({ input }) => {
      const db = getDb();
      const status = input?.status ?? "pending";
      const limit = input?.limit ?? 50;
      return db.select().from(pendingUpdates).where(eq5(pendingUpdates.status, status)).orderBy(desc2(pendingUpdates.createdAt)).limit(limit);
    }),
    /** Accept a pending update: apply the proposed values to the live row. */
    accept: adminKeyProcedure.input(
      z2.object({
        id: z2.number(),
        reviewNotes: z2.string().max(2e3).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [pu] = await db.select().from(pendingUpdates).where(eq5(pendingUpdates.id, input.id)).limit(1);
      if (!pu) throw new Error(`pending update ${input.id} not found`);
      if (pu.status !== "pending") {
        throw new Error(`pending update ${input.id} already ${pu.status}`);
      }
      if (!pu.targetRecordId) {
        throw new Error(`pending update ${input.id} has no target record`);
      }
      const proposed = pu.proposed;
      await db.update(modelEnergyRecords).set({
        ...proposed,
        // Don't overwrite the DB-managed id / fingerprint / promotion fields.
        id: void 0,
        sourceFingerprint: void 0,
        lastVerifiedAt: /* @__PURE__ */ new Date()
      }).where(eq5(modelEnergyRecords.id, pu.targetRecordId));
      await db.update(pendingUpdates).set({
        status: "accepted",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedBy: ctx.user?.email ?? "admin-key",
        reviewNotes: input.reviewNotes ?? null
      }).where(eq5(pendingUpdates.id, input.id));
      return { success: true };
    }),
    /** Reject a pending update: mark rejected, do NOT modify live row. */
    reject: adminKeyProcedure.input(
      z2.object({
        id: z2.number(),
        reviewNotes: z2.string().max(2e3).optional()
      })
    ).mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(pendingUpdates).set({
        status: "rejected",
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedBy: ctx.user?.email ?? "admin-key",
        reviewNotes: input.reviewNotes ?? null
      }).where(and(eq5(pendingUpdates.id, input.id), eq5(pendingUpdates.status, "pending")));
      return { success: true };
    }),
    /** Count pending updates awaiting review (used for the admin nav badge). */
    count: adminKeyProcedure.query(async () => {
      const db = getDb();
      const rows = await db.select({ n: sql3`count(*)` }).from(pendingUpdates).where(eq5(pendingUpdates.status, "pending"));
      return rows[0]?.n ?? 0;
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/vercel-handler.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerOAuthRoutes(app);
registerIngestRoutes(app);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    runtime: "vercel-serverless",
    env: process.env.NODE_ENV ?? "production"
  });
});
var vercel_handler_default = app;
export {
  vercel_handler_default as default
};
