/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Navbar: Persistent top navigation with luminous border bottom
 */
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/" },
  { label: "Data Explorer", href: "/#explorer" },
  { label: "Compare", href: "/#compare" },
  { label: "Methodology", href: "/#methodology" },
  { label: "Agents & Sensors", href: "/#agents" },
  { label: "Sensor Demo", href: "/sensors" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contribute", href: "/#contribute" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0B1120]/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img
              src="/logo.png"
              alt="AI Power"
              className="h-32 w-auto -my-4 group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href.replace("/#", "/"));
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-teal bg-teal/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/[0.06] bg-[#0B1120]/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
