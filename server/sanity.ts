import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.SANITY_PROJECT_ID || "";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN || "";

export const sanityClient = createClient({
  projectId,
  dataset,
  token,
  useCdn: false, // Server-side: always fresh data
  apiVersion: "2024-01-01",
});

// Read-only client for public content (uses CDN)
export const sanityPublicClient = createClient({
  projectId,
  dataset,
  useCdn: true,
  apiVersion: "2024-01-01",
});

// Image URL builder
const builder = imageUrlBuilder(sanityClient);
export function urlFor(source: any) {
  return builder.image(source);
}

// Helper: fetch all documents of a type
export async function fetchByType<T = any>(type: string, query?: string): Promise<T[]> {
  const groq = query || `*[_type == "${type}"] | order(_createdAt desc)`;
  return sanityClient.fetch<T[]>(groq);
}

// Helper: fetch a single document by slug
export async function fetchBySlug<T = any>(type: string, slug: string): Promise<T | null> {
  const groq = `*[_type == "${type}" && slug.current == $slug][0]`;
  const result = await sanityClient.fetch<T>(groq, { slug });
  return result || null;
}

// Helper: fetch site settings (singleton)
export async function fetchSiteSettings<T = any>(): Promise<T | null> {
  const groq = `*[_type == "siteSettings"][0]`;
  return sanityClient.fetch<T>(groq);
}
