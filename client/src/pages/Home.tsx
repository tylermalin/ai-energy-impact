/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Home: Main page composing all observatory sections
 */
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsOverview from "@/components/StatsOverview";
import DataExplorer from "@/components/DataExplorer";
import InsightsSection from "@/components/InsightsSection";
import MethodologySection from "@/components/MethodologySection";
import AgentsSection from "@/components/AgentsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background dot-grid">
      <Navbar />
      <main>
        <HeroSection />
        <StatsOverview />
        <DataExplorer />
        <InsightsSection />
        <MethodologySection />
        <AgentsSection />
      </main>
      <Footer />
    </div>
  );
}
