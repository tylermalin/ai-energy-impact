import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock the Sanity client before importing routers
vi.mock("./sanity", () => {
  const mockFetch = vi.fn();
  return {
    sanityClient: {
      fetch: mockFetch,
    },
    sanityPublicClient: {
      fetch: mockFetch,
    },
    urlFor: vi.fn(),
    fetchByType: vi.fn(),
    fetchBySlug: vi.fn(),
    fetchSiteSettings: vi.fn(),
  };
});

import { sanityClient } from "./sanity";
import { QUERIES } from "./sanity-schemas";

describe("CMS Sanity Queries", () => {
  it("should have all required GROQ queries defined", () => {
    expect(QUERIES.allPosts).toBeDefined();
    expect(QUERIES.allPosts).toContain('_type == "blogPost"');

    expect(QUERIES.postBySlug).toBeDefined();
    expect(QUERIES.postBySlug).toContain("slug.current == $slug");

    expect(QUERIES.allTeamMembers).toBeDefined();
    expect(QUERIES.allTeamMembers).toContain('_type == "teamMember"');

    expect(QUERIES.siteSettings).toBeDefined();
    expect(QUERIES.siteSettings).toContain('_type == "siteSettings"');

    expect(QUERIES.featuredPosts).toBeDefined();
    expect(QUERIES.featuredPosts).toContain("featured == true");

    expect(QUERIES.postsByCategory).toBeDefined();
    expect(QUERIES.postsByCategory).toContain("category == $category");
  });

  it("should have correct field projections in allPosts query", () => {
    const q = QUERIES.allPosts;
    expect(q).toContain("_id");
    expect(q).toContain("title");
    expect(q).toContain("slug");
    expect(q).toContain("excerpt");
    expect(q).toContain("category");
    expect(q).toContain("tags");
    expect(q).toContain("publishedAt");
    expect(q).toContain("featured");
    expect(q).toContain("author");
    expect(q).toContain("coverImageUrl");
  });

  it("should have correct field projections in postBySlug query", () => {
    const q = QUERIES.postBySlug;
    expect(q).toContain("body");
    expect(q).toContain("title");
    expect(q).toContain("slug");
    expect(q).toContain("excerpt");
    expect(q).toContain("category");
    expect(q).toContain("coverImageUrl");
  });

  it("should have correct field projections in allTeamMembers query", () => {
    const q = QUERIES.allTeamMembers;
    expect(q).toContain("name");
    expect(q).toContain("role");
    expect(q).toContain("bio");
    expect(q).toContain("photoUrl");
    expect(q).toContain("order");
  });

  it("should have correct field projections in siteSettings query", () => {
    const q = QUERIES.siteSettings;
    expect(q).toContain("heroTitle");
    expect(q).toContain("heroHighlight");
    expect(q).toContain("heroDescription");
    expect(q).toContain("ctaExploreLabel");
    expect(q).toContain("ctaMethodologyLabel");
    expect(q).toContain("ctaAgentsLabel");
    expect(q).toContain("ctaPaperLabel");
    expect(q).toContain("ctaPaperUrl");
    expect(q).toContain("footerTagline");
    expect(q).toContain("socialLinks");
  });

  // Note: aiModel data now reads from MySQL via cms.modelsForDashboard,
  // not from Sanity. The allModels GROQ query was removed in Phase 3b's
  // Sanity cleanup. See lib/dashboard/models.ts.

  it("should order posts by publishedAt desc", () => {
    expect(QUERIES.allPosts).toContain("order(publishedAt desc)");
  });

  it("should order team members by order asc", () => {
    expect(QUERIES.allTeamMembers).toContain("order(order asc)");
  });
});

describe("Sanity Schema Types", () => {
  it("should export BlogPost interface fields", async () => {
    const schemas = await import("./sanity-schemas");
    // Verify the QUERIES object has the expected keys
    expect(Object.keys(schemas.QUERIES)).toEqual(
      expect.arrayContaining([
        "allPosts",
        "featuredPosts",
        "postBySlug",
        "postsByCategory",
        "allModels",
        "allTeamMembers",
        "siteSettings",
      ])
    );
  });
});

describe("Sanity Client Configuration", () => {
  it("should create a Sanity client with fetch method", () => {
    expect(sanityClient).toBeDefined();
    expect(typeof sanityClient.fetch).toBe("function");
  });

  it("should call fetch with correct query for posts", async () => {
    const mockPosts = [
      {
        _id: "test-1",
        title: "Test Post",
        slug: { current: "test-post" },
        category: "research",
        publishedAt: "2026-04-01",
      },
    ];
    (sanityClient.fetch as any).mockResolvedValueOnce(mockPosts);

    const result = await sanityClient.fetch(QUERIES.allPosts);
    expect(sanityClient.fetch).toHaveBeenCalledWith(QUERIES.allPosts);
    expect(result).toEqual(mockPosts);
  });

  it("should call fetch with slug parameter for postBySlug", async () => {
    const mockPost = {
      _id: "test-1",
      title: "Test Post",
      slug: { current: "test-post" },
      body: [],
      category: "research",
    };
    (sanityClient.fetch as any).mockResolvedValueOnce(mockPost);

    const result = await sanityClient.fetch(QUERIES.postBySlug, { slug: "test-post" });
    expect(sanityClient.fetch).toHaveBeenCalledWith(QUERIES.postBySlug, { slug: "test-post" });
    expect(result).toEqual(mockPost);
  });

  it("should call fetch for team members", async () => {
    const mockTeam = [
      { _id: "member-1", name: "Tyler Malin", role: "CEO & Founder" },
    ];
    (sanityClient.fetch as any).mockResolvedValueOnce(mockTeam);

    const result = await sanityClient.fetch(QUERIES.allTeamMembers);
    expect(sanityClient.fetch).toHaveBeenCalledWith(QUERIES.allTeamMembers);
    expect(result).toEqual(mockTeam);
  });

  it("should call fetch for site settings", async () => {
    const mockSettings = {
      heroTitle: "The Environmental Cost of",
      heroHighlight: "Artificial Intelligence",
      heroDescription: "A comprehensive analysis...",
      ctaExploreLabel: "Explore Data",
      ctaMethodologyLabel: "Methodology",
      ctaAgentsLabel: "Agents & Sensors",
      ctaPaperLabel: "AICo2 Paper",
      ctaPaperUrl: "https://example.com/paper.pdf",
      footerTagline: "Measuring what matters. Transparently.",
    };
    (sanityClient.fetch as any).mockResolvedValueOnce(mockSettings);

    const result = await sanityClient.fetch(QUERIES.siteSettings);
    expect(sanityClient.fetch).toHaveBeenCalledWith(QUERIES.siteSettings);
    expect(result).toEqual(mockSettings);
    expect(result.heroTitle).toBe("The Environmental Cost of");
    expect(result.heroHighlight).toBe("Artificial Intelligence");
    expect(result.ctaExploreLabel).toBe("Explore Data");
    expect(result.ctaMethodologyLabel).toBe("Methodology");
    expect(result.ctaAgentsLabel).toBe("Agents & Sensors");
    expect(result.ctaPaperLabel).toBe("AICo2 Paper");
    expect(result.ctaPaperUrl).toBe("https://example.com/paper.pdf");
    expect(result.footerTagline).toBe("Measuring what matters. Transparently.");
  });

  it("should return all hero-related fields from siteSettings query", () => {
    const q = QUERIES.siteSettings;
    // Verify all fields needed by HeroSection are projected
    const heroFields = [
      "heroTitle",
      "heroHighlight",
      "heroDescription",
      "ctaExploreLabel",
      "ctaMethodologyLabel",
      "ctaAgentsLabel",
      "ctaPaperLabel",
      "ctaPaperUrl",
    ];
    for (const field of heroFields) {
      expect(q).toContain(field);
    }
  });

  it("should return footer-related fields from siteSettings query", () => {
    const q = QUERIES.siteSettings;
    expect(q).toContain("footerTagline");
    expect(q).toContain("contactEmail");
  });
});
