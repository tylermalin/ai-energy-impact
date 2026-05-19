import { createClient, type SanityClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";

const projectId = process.env.SANITY_PROJECT_ID || "";
const dataset = process.env.SANITY_DATASET || "production";
const token = process.env.SANITY_API_TOKEN || "";

/**
 * Dev-ergonomics stub: when SANITY_PROJECT_ID is not configured we don't
 * crash the server. Instead we export a tiny stub matching the bits of the
 * SanityClient API the app actually calls (`.fetch()`), so the UI falls
 * back to its hardcoded defaults (HeroSection DEFAULTS, the static
 * AI_MODELS array in client/src/lib/data.ts, etc). Remove once Sanity
 * becomes canonical in Phase 1.
 */
const SANITY_DISABLED = !projectId;

if (SANITY_DISABLED) {
  // eslint-disable-next-line no-console
  console.warn(
    "[sanity] SANITY_PROJECT_ID not set — running with stub client. " +
      "CMS queries will return null and the UI will fall back to hardcoded defaults.",
  );
}

function makeStubClient(): SanityClient {
  // any: deliberately partial implementation; cast to SanityClient for
  // type-compat with callsites that only use .fetch().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stub: any = {
    fetch: async <T = unknown>(): Promise<T> => null as unknown as T,
    config: () => ({ projectId, dataset }),
  };
  return stub as SanityClient;
}

export const sanityClient: SanityClient = SANITY_DISABLED
  ? makeStubClient()
  : createClient({
      projectId,
      dataset,
      token,
      useCdn: false, // Server-side: always fresh data
      apiVersion: "2024-01-01",
    });

// Read-only client for public content (uses CDN)
export const sanityPublicClient: SanityClient = SANITY_DISABLED
  ? makeStubClient()
  : createClient({
      projectId,
      dataset,
      useCdn: true,
      apiVersion: "2024-01-01",
    });

// Image URL builder — only meaningful when Sanity is configured.
const builder = SANITY_DISABLED ? null : imageUrlBuilder(sanityClient);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  if (!builder) {
    // Chainable noop matching the subset of the builder API callers use.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const noop: any = {
      width: () => noop,
      height: () => noop,
      url: () => "",
      toString: () => "",
    };
    return noop;
  }
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
