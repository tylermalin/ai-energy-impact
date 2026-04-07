/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * 404 page styled to match the dark observatory theme.
 */
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0B1120] relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(45,212,191,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]" />

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse scale-125" />
            <div className="w-20 h-20 rounded-full border border-red-500/20 bg-red-500/5 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* Error code */}
        <h1 className="font-['Space_Grotesk'] text-7xl font-bold text-white/90 mb-3 tracking-tight">
          404
        </h1>

        <h2 className="font-['Space_Grotesk'] text-xl font-semibold text-white/60 mb-4">
          Signal Not Found
        </h2>

        <p className="font-['IBM_Plex_Sans'] text-white/40 mb-10 leading-relaxed text-sm">
          The page you're looking for doesn't exist or has been moved.
          <br />
          Check the URL or return to the dashboard.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white px-5 py-2.5 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => setLocation("/")}
            className="bg-teal-500/20 border border-teal-500/30 text-teal-300 hover:bg-teal-500/30 hover:text-teal-200 px-5 py-2.5 rounded-lg transition-all duration-200"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Decorative line */}
        <div className="mt-12 flex items-center justify-center gap-2">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
          <span className="font-['IBM_Plex_Mono'] text-[10px] text-white/20 uppercase tracking-widest">
            AI Energy Impact
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
        </div>
      </div>
    </div>
  );
}
