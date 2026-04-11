/**
 * About / Team page — fetches team members from Sanity CMS
 * Observatory dark theme
 */
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Linkedin, Twitter, Globe, ExternalLink } from "lucide-react";
import { AICO2_METHODOLOGY_URL } from "@/lib/data";

export default function About() {
  const { data: team, isLoading: teamLoading } = trpc.cms.team.useQuery();
  const { data: settings } = trpc.cms.siteSettings.useQuery();

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 border border-teal/20 mb-6">
              <Users className="w-3.5 h-3.5 text-teal" />
              <span className="text-xs font-mono text-teal uppercase tracking-widest">
                About Us
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white/90 mb-4">
              {settings?.siteTitle || "AI Energy Impact"}
            </h1>
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed text-lg">
              {settings?.siteDescription ||
                "Measuring and reducing the environmental footprint of artificial intelligence through transparent data, open methodology, and trusted sensor infrastructure."}
            </p>
          </div>

          {/* Mission */}
          <div className="rounded-xl border border-teal/20 bg-gradient-to-br from-teal/5 to-transparent p-8 mb-16">
            <h2 className="font-display text-2xl font-bold text-white/90 mb-4">Our Mission</h2>
            <p className="text-white/50 leading-relaxed mb-4">
              The AI industry's environmental impact is growing rapidly, yet the data needed to
              understand and reduce it remains fragmented, estimated, and often opaque. We believe
              that <strong className="text-white/80">you can't reduce what you can't measure</strong>.
            </p>
            <p className="text-white/50 leading-relaxed mb-4">
              This platform aggregates the best available research on AI energy consumption, carbon
              emissions, and water usage — while being transparent about the limitations of current
              measurement approaches. Our goal is to push the industry toward{" "}
              <strong className="text-white/80">hardware-level, sensor-verified measurement</strong>{" "}
              through Malama dMRV sensors deployed directly inside data centers.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href={AICO2_METHODOLOGY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal/10 border border-teal/20 text-teal text-sm font-medium hover:bg-teal/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Read the AICo2 Methodology
              </a>
            </div>
          </div>

          {/* Team */}
          <div className="mb-16">
            <h2 className="font-display text-2xl font-bold text-white/90 mb-8 text-center">
              Team
            </h2>

            {teamLoading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/40 font-mono text-sm">Loading team...</p>
              </div>
            )}

            {team && (team as any[]).length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(team as any[]).map((member: any) => (
                  <div
                    key={member._id}
                    className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center hover:border-white/[0.12] transition-all"
                  >
                    {/* Avatar */}
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-white/[0.08]"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-teal/20 to-teal/5 border border-teal/20 flex items-center justify-center">
                        <span className="font-display text-2xl font-bold text-teal">
                          {member.name?.charAt(0) || "?"}
                        </span>
                      </div>
                    )}

                    <h3 className="font-display text-lg font-semibold text-white/90 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-teal font-medium mb-3">{member.role}</p>
                    {member.bio && (
                      <p className="text-xs text-white/40 leading-relaxed mb-4">{member.bio}</p>
                    )}

                    {/* Social links */}
                    <div className="flex items-center justify-center gap-3">
                      {member.linkedIn && (
                        <a
                          href={member.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/30 hover:text-teal transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {member.twitter && (
                        <a
                          href={member.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/30 hover:text-teal transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {member.website && (
                        <a
                          href={member.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/30 hover:text-teal transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!teamLoading && (!team || (team as any[]).length === 0) && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-white/40 font-mono text-sm">
                  Team members coming soon.
                </p>
              </div>
            )}
          </div>

          {/* Contact CTA */}
          <div className="text-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-10">
            <h2 className="font-display text-xl font-bold text-white/90 mb-3">
              Want to Contribute?
            </h2>
            <p className="text-white/40 mb-6 max-w-lg mx-auto">
              We welcome researchers, data center operators, and anyone with better data or
              methodology improvements.
            </p>
            <a
              href="/#contribute"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal/20 border border-teal/30 text-teal text-sm font-medium hover:bg-teal/30 transition-all"
            >
              Submit a Contribution
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
