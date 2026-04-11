/**
 * Sanity Schema Definitions (reference for Sanity Studio setup)
 * These types mirror the schemas that should be created in Sanity Studio.
 * 
 * To set up schemas in Sanity Studio, create these document types:
 * 
 * 1. blogPost - Blog / Research Updates
 * 2. aiModel - AI Model Data
 * 3. teamMember - Team / About Content
 * 4. siteSettings - Site-wide Settings (singleton)
 */

// ============================================================
// TypeScript interfaces for Sanity documents
// ============================================================

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
}

export interface SanitySlug {
  _type: "slug";
  current: string;
}

export interface SanityBlockContent {
  _type: "block";
  children: Array<{
    _type: "span";
    text: string;
    marks?: string[];
  }>;
  style?: string;
  markDefs?: any[];
}

// --- Blog Post ---
export interface BlogPost {
  _id: string;
  _type: "blogPost";
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: SanitySlug;
  excerpt: string;
  body: SanityBlockContent[];
  coverImage?: SanityImage;
  author?: string;
  category: "research" | "news" | "analysis" | "methodology" | "sensors";
  tags?: string[];
  publishedAt: string;
  featured?: boolean;
}

// --- AI Model ---
export interface SanityAIModel {
  _id: string;
  _type: "aiModel";
  _createdAt: string;
  _updatedAt: string;
  task: string;
  model: string;
  size: string;
  energy: string;
  carbon: string;
  water: string;
  utility: string;
  source: string;
  category: "text" | "image" | "video" | "audio" | "other";
  notes?: string;
  active: boolean;
}

// --- Team Member ---
export interface TeamMember {
  _id: string;
  _type: "teamMember";
  _createdAt: string;
  _updatedAt: string;
  name: string;
  role: string;
  bio: string;
  photo?: SanityImage;
  linkedin?: string;
  twitter?: string;
  website?: string;
  order: number;
}

// --- Site Settings (Singleton) ---
export interface SiteSettings {
  _id: string;
  _type: "siteSettings";
  heroTitle?: string;
  heroHighlight?: string;
  heroDescription?: string;
  ctaExploreLabel?: string;
  ctaMethodologyLabel?: string;
  ctaAgentsLabel?: string;
  ctaPaperLabel?: string;
  ctaPaperUrl?: string;
  aboutText?: string;
  footerTagline?: string;
  contactEmail?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

// ============================================================
// GROQ Queries
// ============================================================

export const QUERIES = {
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

  // AI Models
  allModels: `*[_type == "aiModel" && active == true] | order(category asc, model asc) {
    _id, task, model, size, energy, carbon, water, utility, source, category, notes
  }`,

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
  }`,
};
