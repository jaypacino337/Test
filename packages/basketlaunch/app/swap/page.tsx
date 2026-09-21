import { PoolList } from "@/components/PoolList";
import { RecentSwaps } from "@/components/RecentSwaps";
import { SwapCard } from "@/components/SwapCard";

export const metadata = {
  title: "Swap — BasketLaunch",
  description:
    "Route a swap across the simulated pool graph: best path, live price impact, slippage control.",
};

export default function SwapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <span className="chip">Swap</span>
        <h1 className="headline mt-5 text-4xl font-semibold text-mist-100 sm:text-5xl">
          Best route, every trade.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-mist-300 sm:text-base">
          The router prices your trade through every direct pool and every two-leg path, then
          quotes whichever pays out most — with the impact and the minimum you&apos;d receive shown
          before you sign.
        </p>
      </header>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,460px)_1fr]">
        <div className="min-w-0">
          <SwapCard />
        </div>
        <div className="grid min-w-0 content-start gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <PoolList />
          <RecentSwaps />
        </div>
      </div>
    </div>
  );
}
