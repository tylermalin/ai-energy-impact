/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Footer: Minimal observatory-style footer
 * Accepts optional siteSettings from Sanity CMS for dynamic tagline
 */
import { FileDown } from "lucide-react";
import { AICO2_METHODOLOGY_URL } from "@/lib/data";

interface SiteSettings {
  footerTagline?: string;
  ctaPaperUrl?: string;
}

interface FooterProps {
  siteSettings?: SiteSettings;
}

export default function Footer({ siteSettings }: FooterProps) {
  const paperUrl = siteSettings?.ctaPaperUrl || AICO2_METHODOLOGY_URL;

  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img src="/logo.png" alt="AI Power" className="h-16 w-auto" />
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-xs mb-3">
              Comprehensive analysis of AI model energy consumption, carbon emissions, and water usage. Data compiled from peer-reviewed research and industry reports.
            </p>
            <p className="text-[11px] text-white/30 leading-relaxed max-w-xs">
              A project of the{" "}
              <a
                href="https://malamafoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal/70 hover:text-teal transition-colors underline underline-offset-2"
              >
                Mālama Foundation
              </a>
              {" "}— a nonprofit advancing transparent environmental measurement for emerging technologies.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/60 mb-4">Explore</h4>
            <ul className="space-y-2">
              {[
                { label: "Data Explorer", href: "#explorer" },
                { label: "Compare Models", href: "#compare" },
                { label: "Key Insights", href: "#insights" },
                { label: "Methodology & Sources", href: "#methodology" },
                { label: "Agents & Sensors", href: "#agents" },
                { label: "Sensor Demo", href: "/sensors" },
                { label: "Blog", href: "/blog" },
                { label: "About", href: "/about" },
                { label: "Contribute Data", href: "#contribute" },
                { label: "Admin", href: "/admin" },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-xs text-white/35 hover:text-teal transition-colors">{item.label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-white/60 mb-4">About</h4>
            <p className="text-xs text-white/35 leading-relaxed">
              This dashboard aggregates data from 20+ research sources to provide a unified view of AI's environmental footprint. All energy values are per-prompt estimates. See our <a href="#methodology" className="text-teal/60 hover:text-teal transition-colors underline underline-offset-2">Methodology</a> section for full transparency on data sourcing and model assumptions.
            </p>
            <a
              href={paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-teal/50 hover:text-teal transition-colors"
            >
              <FileDown className="w-3 h-3" />
              Mālama AICo2 Methodology (PDF)
            </a>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              <span className="text-[10px] text-teal/60 uppercase tracking-wider font-medium">Live Data</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-white/25">
            {siteSettings?.footerTagline || "© 2026 AI Energy & Environmental Impact Dashboard · A project of the "}
            {!siteSettings?.footerTagline && (
              <a
                href="https://malamafoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-teal transition-colors"
              >
                Mālama Foundation
              </a>
            )}
          </p>
          <p className="text-[11px] text-white/25 font-data">
            Live data · Mālama AICo2 methodology
          </p>
        </div>
      </div>
    </footer>
  );
}
