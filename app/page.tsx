import { fetchLandingStats, fetchLeaderboard } from "@/components/landing/data";
import { Hero, Nav } from "@/components/landing/Hero";
import { HowItWorks, Problem } from "@/components/landing/Explain";
import { Leaderboard } from "@/components/landing/Leaderboard";
import { Faq, Trust } from "@/components/landing/Trust";
import { FinalCta, Footer } from "@/components/landing/Footer";

// Landing page — server-rendered, stats refresh every 5 minutes.
export const revalidate = 300;

export default async function LandingPage() {
  const [stats, leaderboard] = await Promise.all([
    fetchLandingStats(),
    fetchLeaderboard(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-6">
      <Nav />
      <Hero stats={stats} />
      <Problem />
      <HowItWorks />
      <Leaderboard rows={leaderboard} stats={stats} />
      <Trust />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}
