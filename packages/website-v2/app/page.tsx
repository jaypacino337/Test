import { LiveProvider } from "@/components/Live";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import { SmoothScroll } from "@/components/fx/SmoothScroll";
import { Almanac } from "@/components/sections/Almanac";
import { Charter, Ticker } from "@/components/sections/Charter";
import { Faq } from "@/components/sections/Faq";
import { Cta, Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Ledger } from "@/components/sections/Ledger";
import { Navbar } from "@/components/sections/Navbar";
import { Route } from "@/components/sections/Route";
import { Volleys } from "@/components/sections/Volleys";
import { getSiteStats } from "@/lib/stats";

export const revalidate = 30;

export default async function Home() {
  const stats = await getSiteStats();
  return (
    <LiveProvider initial={stats}>
      <SmoothScroll />
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero />
        <div className="mt-10 overflow-hidden py-6">
          <Ticker />
        </div>
        <Almanac />
        <Volleys />
        <Route />
        <Ledger />
        <Charter />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </LiveProvider>
  );
}
