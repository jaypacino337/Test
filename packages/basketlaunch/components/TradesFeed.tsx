"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { shortAddress, sol, timeAgo } from "@/lib/format";

export function TradesFeed({ slug, limit = 12 }: { slug?: string; limit?: number }) {
  const { trades, baskets, now } = useStore();
  const rows = trades.filter((trade) => !slug || trade.basket === slug).slice(0, limit);
  const nameFor = (basketSlug: string) =>
    baskets.find((basket) => basket.slug === basketSlug)?.ticker ?? basketSlug;

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-mist-100">
          {slug ? "Trades" : "Live activity"}
        </h3>
        <span className="flex items-center gap-1.5 text-[11px] text-mist-500">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-breathe" />
          simulated
        </span>
      </div>

      {rows.length ? (
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {rows.map((trade) => (
            <li key={trade.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span
                className={`num rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                  trade.side === "buy"
                    ? "bg-lime-400/12 text-lime-300"
                    : "bg-rose-400/12 text-rose-400"
                }`}
              >
                {trade.side}
              </span>
              <span className="num text-xs text-mist-500">{shortAddress(trade.trader, 4, 4)}</span>
              {slug ? null : (
                <Link
                  href={`/basket/${trade.basket}`}
                  className="num text-xs text-mist-300 hover:text-lime-300"
                >
                  ${nameFor(trade.basket)}
                </Link>
              )}
              <span className="num ml-auto text-mist-100">{sol(trade.sol)}</span>
              <span className="num w-10 text-right text-[11px] text-mist-700">
                {timeAgo(trade.at, now)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-mist-500">No trades yet — be the first.</p>
      )}
    </div>
  );
}
