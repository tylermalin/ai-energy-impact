/**
 * About / Team page — fetches team members from Sanity CMS
 * Observatory dark theme
 */
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Users, Linkedin, Twitter, Globe, ExternalLink, Eye, Target, Activity, Cpu } from "lucide-react";
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
                About
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white/90 mb-4">
              {settings?.siteTitle || "AI Energy Impact"}
            </h1>
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed text-lg">
              {settings?.siteDescription ||
                "The public-interest measurement layer for AI's environmental footprint — energy, carbon, water, hardware — with every number sourced and every assumption stated."}
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-12 rounded-xl border border-white/[0.06] bg-white/[0.02] p-8">
            <p className="text-white/55 leading-relaxed mb-4 text-[15px]">
              AI is becoming infrastructure. By 2030, data centers are projected to consume{" "}
              <strong className="text-white/80">over 1,000 TWh annually</strong> — more electricity
              than entire industrialized nations. The carbon, water, and grid impact of every model
              we use compounds across billions of prompts a day.
            </p>
            <p className="text-white/55 leading-relaxed mb-4 text-[15px]">
              Yet the data needed to understand and reduce that footprint is{" "}
              <strong className="text-white/80">fragmented, estimated, and often opaque</strong>.
              The Federation of American Scientists has documented that AI providers "report
              whatever they choose, however they choose." The true carbon footprint of major
              providers may be up to <strong className="text-white/80">662% higher</strong> than
              publicly reported figures.
            </p>
            <p className="text-white/55 leading-relaxed text-[15px]">
              We're building the measurement layer that should exist for an industry of this scale —
              open, sourced, and corrigible by anyone.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-xl border border-teal/20 bg-gradient-to-br from-teal/5 to-transparent p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-teal" />
              <h2 className="font-display text-2xl font-bold text-white/90">Vision</h2>
            </div>
            <p className="text-white/55 leading-relaxed text-[15px]">
              A future where every model's environmental cost is visible at the moment of use —
              where developers, regulators, and end users can compare AI systems on the same axes
              they already compare them on for accuracy and price. Where the choice to use a larger,
              hungrier model is a conscious one. Where the industry's reported footprint matches
              its actual footprint, verified by hardware, not press release.
            </p>
          </div>

          {/* Mission */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-teal" />
              <h2 className="font-display text-2xl font-bold text-white/90">Mission</h2>
            </div>
            <p className="text-white/55 leading-relaxed mb-4 text-[15px]">
              <strong className="text-white/80">You can't reduce what you can't measure.</strong>
            </p>
            <p className="text-white/55 leading-relaxed mb-4 text-[15px]">
              This platform aggregates the best available research on AI energy consumption,
              carbon emissions, and water usage — while being transparent about the limitations of
              current measurement approaches. Our long-term goal is to push the industry toward{" "}
              <strong className="text-white/80">hardware-level, sensor-verified measurement</strong>{" "}
              via Mālama Labs dMRV sensors deployed directly inside data centers.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href={AICO2_METHODOLOGY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal/10 border border-teal/20 text-teal text-sm font-medium hover:bg-teal/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Read the Mālama AICo2 Methodology
              </a>
            </div>
          </div>

          {/* What we track */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-teal" />
              <h2 className="font-display text-2xl font-bold text-white/90">What we track</h2>
            </div>
            <p className="text-white/55 leading-relaxed mb-5 text-[15px]">
              Every row in the dashboard carries the same provenance fields, regardless of source.
              The dashboard surfaces one canonical entry per model + category, merged across sources.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-teal/70 font-mono uppercase text-[11px] tracking-wider mb-1.5">Per-inference metrics</div>
                <ul className="space-y-1 text-white/45 leading-relaxed">
                  <li>• Energy (Wh) with min / max bounds where reported</li>
                  <li>• Carbon (gCO2e) computed via grid intensity</li>
                  <li>• Water (mL) computed via facility WUE</li>
                </ul>
              </div>
              <div>
                <div className="text-teal/70 font-mono uppercase text-[11px] tracking-wider mb-1.5">Provenance</div>
                <ul className="space-y-1 text-white/45 leading-relaxed">
                  <li>• Classification: measured / derived / estimated</li>
                  <li>• Confidence: high / medium / low</li>
                  <li>• Source name, URL, measurement date</li>
                </ul>
              </div>
              <div>
                <div className="text-teal/70 font-mono uppercase text-[11px] tracking-wider mb-1.5">Conditions</div>
                <ul className="space-y-1 text-white/45 leading-relaxed">
                  <li>• Hardware (GPU/TPU model)</li>
                  <li>• Context length, batch size</li>
                  <li>• Prompt class, standardization notes</li>
                </ul>
              </div>
              <div>
                <div className="text-teal/70 font-mono uppercase text-[11px] tracking-wider mb-1.5">AICo2 audit fields</div>
                <ul className="space-y-1 text-white/45 leading-relaxed">
                  <li>• τ (task scaling), F (facility multiplier)</li>
                  <li>• Applied PUE and grid carbon intensity</li>
                  <li>• Methodology version + facility class</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Mālama Foundation */}
          <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-8 mb-16">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-5 h-5 text-teal" />
              <h2 className="font-display text-2xl font-bold text-white/90">A project of the Mālama Foundation</h2>
            </div>
            <p className="text-white/55 leading-relaxed mb-4 text-[15px]">
              AI Energy Impact is a project of the{" "}
              <a
                href="https://malamafoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal/80 hover:text-teal underline underline-offset-2 transition-colors"
              >
                Mālama Foundation
              </a>
              {" "}— a nonprofit advancing transparent environmental measurement for emerging
              technologies. The foundation funds open data and methodology work that the
              market alone won't produce: standards, registries, and the early-stage research
              that lets later commercial efforts have something honest to build on.
            </p>
            <p className="text-white/55 leading-relaxed text-[15px]">
              The companion commercial entity,{" "}
              <a
                href="https://malamalabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal/80 hover:text-teal underline underline-offset-2 transition-colors"
              >
                Mālama Labs
              </a>
              , is developing the hardware-signed dMRV sensors that will eventually replace
              the estimated rows on this dashboard with measured ones. Until those sensors are
              deployed inside production data centers, this dashboard does the best work that
              public data alone allows.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <a
                href="https://malamafoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal/10 border border-teal/20 text-teal text-sm font-medium hover:bg-teal/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mālama Foundation
              </a>
              <a
                href="https://malamalabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.06] transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mālama Labs
              </a>
              <a
                href="/sensors"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm font-medium hover:bg-white/[0.06] transition-all"
              >
                View Sensor Demo
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
