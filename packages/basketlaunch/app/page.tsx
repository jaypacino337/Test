import { ExploreGrid } from "@/components/ExploreGrid";
import { Hero } from "@/components/Hero";
import { HowItWorksStrip } from "@/components/HowItWorksStrip";
import { TradesFeed } from "@/components/TradesFeed";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorksStrip />
      <ExploreGrid />
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <TradesFeed limit={14} />
      </section>
    </>
  );
}
