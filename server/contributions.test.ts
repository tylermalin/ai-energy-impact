import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the db module
vi.mock("./db", () => ({
  createContribution: vi.fn().mockResolvedValue(1),
  listContributions: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Dr. Jane Smith",
      email: "jane@university.edu",
      organization: "MIT",
      contributionType: "new_model_data",
      message: "New energy measurement data for GPT-5",
      dataUrl: "https://doi.org/10.1234/test",
      status: "pending",
      adminNotes: null,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  getContributionById: vi.fn().mockResolvedValue({
    id: 1,
    name: "Dr. Jane Smith",
    email: "jane@university.edu",
    organization: "MIT",
    contributionType: "new_model_data",
    message: "New energy measurement data for GPT-5",
    dataUrl: "https://doi.org/10.1234/test",
    status: "pending",
    adminNotes: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updateContributionStatus: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getDb: vi.fn(),
}));

// Mock the notification module
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("contributions.submit", () => {
  it("accepts a valid submission from a public (unauthenticated) user", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.contributions.submit({
      name: "Dr. Jane Smith",
      email: "jane@university.edu",
      organization: "MIT",
      contributionType: "new_model_data",
      message: "New energy measurement data for GPT-5 using H100 GPUs under standard inference conditions.",
      dataUrl: "https://doi.org/10.1234/test",
    });

    expect(result).toEqual({ success: true, id: 1 });
  });

  it("accepts a submission without optional fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.contributions.submit({
      name: "John Doe",
      email: "john@example.com",
      contributionType: "correction",
      message: "The carbon emission value for DALL-E 3 appears to be incorrect based on updated grid data.",
    });

    expect(result).toEqual({ success: true, id: 1 });
  });

  it("rejects a submission with an invalid email", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.contributions.submit({
        name: "Test User",
        email: "not-an-email",
        contributionType: "other",
        message: "This should fail validation.",
      })
    ).rejects.toThrow();
  });

  it("rejects a submission with a message that is too short", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.contributions.submit({
        name: "Test User",
        email: "test@example.com",
        contributionType: "methodology",
        message: "Too short",
      })
    ).rejects.toThrow();
  });
});

describe("contributions.list (admin only)", () => {
  it("returns contributions when called by an admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.contributions.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Dr. Jane Smith");
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(caller.contributions.list()).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(caller.contributions.list()).rejects.toThrow();
  });
});

describe("contributions.updateStatus (admin only)", () => {
  it("allows admin to update contribution status", async () => {
    const caller = appRouter.createCaller(createAdminContext());

    const result = await caller.contributions.updateStatus({
      id: 1,
      status: "accepted",
      adminNotes: "Great data, incorporating into v2.1",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());

    await expect(
      caller.contributions.updateStatus({
        id: 1,
        status: "reviewed",
      })
    ).rejects.toThrow();
  });
});
