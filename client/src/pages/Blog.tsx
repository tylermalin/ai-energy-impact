/**
 * Blog / Research Updates page — fetches posts from Sanity CMS
 * Observatory dark theme with category filters and featured post hero
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  ArrowRight,
  BookOpen,
  FlaskConical,
  Newspaper,
  BarChart3,
  Cpu,
  Radio,
  Search,
} from "lucide-react";

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  research: { label: "Research", icon: FlaskConical, color: "text-violet-400 bg-violet-500/15 border-violet-500/20" },
  news: { label: "News", icon: Newspaper, color: "text-amber-400 bg-amber-500/15 border-amber-500/20" },
  analysis: { label: "Analysis", icon: BarChart3, color: "text-teal-400 bg-teal-500/15 border-teal-500/20" },
  methodology: { label: "Methodology", icon: Cpu, color: "text-indigo-400 bg-indigo-500/15 border-indigo-500/20" },
  sensors: { label: "Sensors", icon: Radio, color: "text-rose-400 bg-rose-500/15 border-rose-500/20" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function PostCard({ post }: { post: any }) {
  const catConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.research;
  const Icon = catConfig.icon;

  return (
    <Link
      href={`/blog/${post.slug?.current || ""}`}
      className="group block rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
    >
      {/* Cover image */}
      {post.coverImageUrl && (
        <div className="aspect-[16/9] overflow-hidden rounded-t-xl">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-6">
        {/* Category badge + date */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${catConfig.color}`}>
            <Icon className="w-3 h-3" />
            {catConfig.label}
          </span>
          <span className="text-xs text-white/30 font-mono flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.publishedAt)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg font-semibold text-white/90 group-hover:text-teal transition-colors mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-white/40 leading-relaxed line-clamp-3 mb-4">
          {post.excerpt}
        </p>

        {/* Author + read more */}
        <div className="flex items-center justify-between">
          {post.author && (
            <span className="text-xs text-white/30 font-mono">By {post.author}</span>
          )}
          <span className="text-xs text-teal font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Read more <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedPost({ post }: { post: any }) {
  const catConfig = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.research;
  const Icon = catConfig.icon;

  return (
    <Link
      href={`/blog/${post.slug?.current || ""}`}
      className="group block rounded-xl border border-teal/20 bg-gradient-to-br from-teal/5 to-transparent hover:from-teal/10 transition-all duration-300"
    >
      <div className="grid md:grid-cols-2 gap-0">
        {post.coverImageUrl && (
          <div className="aspect-[16/10] md:aspect-auto overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-mono text-teal uppercase tracking-widest">Featured</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${catConfig.color}`}>
              <Icon className="w-3 h-3" />
              {catConfig.label}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-white/90 group-hover:text-teal transition-colors mb-3">
            {post.title}
          </h2>
          <p className="text-white/40 leading-relaxed mb-4">{post.excerpt}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30 font-mono flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(post.publishedAt)}
            </span>
            {post.author && (
              <span className="text-xs text-white/30 font-mono">By {post.author}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Blog() {
  const { data: posts, isLoading, error } = trpc.cms.posts.useQuery();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let filtered = posts as any[];
    if (activeCategory !== "all") {
      filtered = filtered.filter((p: any) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p: any) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [posts, activeCategory, searchQuery]);

  const featuredPost = useMemo(() => {
    if (!posts) return null;
    return (posts as any[]).find((p: any) => p.featured);
  }, [posts]);

  const categories = ["all", ...Object.keys(CATEGORY_CONFIG)];

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 mb-6">
              <BookOpen className="w-3.5 h-3.5 text-teal" />
              <span className="text-xs font-mono text-teal uppercase tracking-widest">
                Research & Updates
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white/90 mb-4">
              Blog
            </h1>
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed">
              Research findings, methodology updates, and news about AI energy
              consumption, sustainability, and the push for transparent measurement.
            </p>
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm placeholder:text-white/25 focus:outline-none focus:border-teal/40 focus:ring-1 focus:ring-teal/20 transition-all"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-teal/20 text-teal border border-teal/30"
                        : "bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]"
                    }`}
                  >
                    {cat === "all" ? "All" : CATEGORY_CONFIG[cat]?.label || cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-mono text-sm">Loading posts...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-400 font-mono text-sm">Failed to load posts. Please try again later.</p>
            </div>
          )}

          {/* Featured Post */}
          {!isLoading && featuredPost && activeCategory === "all" && !searchQuery && (
            <div className="mb-10">
              <FeaturedPost post={featuredPost} />
            </div>
          )}

          {/* Post Grid */}
          {!isLoading && filteredPosts.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts
                .filter((p: any) => !(activeCategory === "all" && !searchQuery && p.featured && p._id === featuredPost?._id))
                .map((post: any) => (
                  <PostCard key={post._id} post={post} />
                ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredPosts.length === 0 && !error && (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-mono text-sm">
                {searchQuery || activeCategory !== "all"
                  ? "No posts match your filters."
                  : "No posts published yet. Check back soon!"}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
