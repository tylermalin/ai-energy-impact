/**
 * Individual Blog Post page — fetches a single post from Sanity by slug
 * Renders portable text (block content) with observatory dark theme
 */
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  ArrowLeft,
  User,
  Tag,
  BookOpen,
  FlaskConical,
  Newspaper,
  BarChart3,
  Cpu,
  Radio,
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

/** Simple portable text renderer for Sanity block content */
function renderBlockContent(blocks: any[]) {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks.map((block: any, idx: number) => {
    if (block._type !== "block") return null;

    const text = block.children
      ?.map((child: any) => {
        if (child.marks?.includes("strong")) return `<strong>${child.text}</strong>`;
        if (child.marks?.includes("em")) return `<em>${child.text}</em>`;
        if (child.marks?.includes("code")) return `<code>${child.text}</code>`;
        return child.text;
      })
      .join("");

    switch (block.style) {
      case "h1":
        return (
          <h1
            key={idx}
            className="font-display text-3xl font-bold text-white/90 mt-10 mb-4"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      case "h2":
        return (
          <h2
            key={idx}
            className="font-display text-2xl font-bold text-white/85 mt-8 mb-3"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      case "h3":
        return (
          <h3
            key={idx}
            className="font-display text-xl font-semibold text-white/80 mt-6 mb-2"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      case "blockquote":
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-teal/40 pl-6 my-6 text-white/50 italic"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      default:
        return (
          <p
            key={idx}
            className="text-white/60 leading-relaxed mb-4"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
    }
  });
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: post, isLoading, error } = trpc.cms.postBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const catConfig = post ? CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.research : null;

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-teal transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 font-mono text-sm">Loading post...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-400 font-mono text-sm">Failed to load post.</p>
            </div>
          )}

          {/* Not found */}
          {!isLoading && !error && !post && (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-mono text-sm">Post not found.</p>
            </div>
          )}

          {/* Post content */}
          {post && catConfig && (
            <article>
              {/* Cover image */}
              {post.coverImageUrl && (
                <div className="aspect-[16/9] overflow-hidden rounded-xl mb-8">
                  <img
                    src={post.coverImageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${catConfig.color}`}>
                  <catConfig.icon className="w-3 h-3" />
                  {catConfig.label}
                </span>
                <span className="text-xs text-white/30 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(post.publishedAt)}
                </span>
                {post.author && (
                  <span className="text-xs text-white/30 font-mono flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {post.author}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white/90 mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-lg text-white/50 leading-relaxed mb-8 border-l-2 border-teal/30 pl-6">
                {post.excerpt}
              </p>

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mb-8" />

              {/* Body */}
              <div className="prose-observatory">
                {renderBlockContent(post.body)}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-white/[0.06]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tag className="w-4 h-4 text-white/20" />
                    {post.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-xs font-mono text-white/40 bg-white/[0.04] border border-white/[0.06]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to blog CTA */}
              <div className="mt-12 text-center">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal/10 border border-teal/20 text-teal text-sm font-medium hover:bg-teal/20 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to all posts
                </Link>
              </div>
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
