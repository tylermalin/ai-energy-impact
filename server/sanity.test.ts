import { describe, expect, it } from "vitest";
import { createClient } from "@sanity/client";

describe("Sanity CMS Integration", () => {
  const projectId = process.env.SANITY_PROJECT_ID || "";
  const dataset = process.env.SANITY_DATASET || "production";
  const token = process.env.SANITY_API_TOKEN || "";

  it("should have Sanity environment variables configured", () => {
    expect(projectId).toBeTruthy();
    expect(dataset).toBeTruthy();
    expect(token).toBeTruthy();
    expect(projectId).toBe("47j8h9i3");
    expect(dataset).toBe("production");
  });

  it("should connect to Sanity and fetch data successfully", async () => {
    const client = createClient({
      projectId,
      dataset,
      token,
      useCdn: false,
      apiVersion: "2024-01-01",
    });

    // Simple query to verify connection - count all documents
    const result = await client.fetch<number>('count(*)');
    // Result should be a number (even 0 is fine for a new project)
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("should be able to query specific document types", async () => {
    const client = createClient({
      projectId,
      dataset,
      token,
      useCdn: false,
      apiVersion: "2024-01-01",
    });

    // Query for any documents - new project may have none
    const docs = await client.fetch('*[0...5]');
    expect(Array.isArray(docs)).toBe(true);
  });
});
