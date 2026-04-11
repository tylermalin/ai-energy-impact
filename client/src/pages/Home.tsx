/**
 * Design: Data Observatory — Scientific Instrument Aesthetic
 * Home: Main page composing all observatory sections
 * Fetches site settings from Sanity CMS for dynamic hero/CTA content
 */
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StatsOverview from "@/components/StatsOverview";
import DataExplorer from "@/components/DataExplorer";
import ComparisonTool from "@/components/ComparisonTool";
import InsightsSection from "@/components/InsightsSection";
import MethodologySection from "@/components/MethodologySection";
import AgentsSection from "@/components/AgentsSection";
import ContributeSection from "@/components/ContributeSection";
import Footer from "@/components/Footer";

export default function Home() {
  const { data: siteSettings } = trpc.cms.siteSettings.useQuery();

  return (
    <div className="min-h-screen bg-background dot-grid">
      <Navbar />
      <main>
        <HeroSection siteSettings={siteSettings ?? undefined} />
        <StatsOverview />
        <DataExplorer />
        <ComparisonTool />
        <InsightsSection />
        <MethodologySection />
        <AgentsSection />
        <ContributeSection />
      </main>
      <Footer siteSettings={siteSettings ?? undefined} />
    </div>
  );
}
