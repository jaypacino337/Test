"use client";

import { useStore } from "@/lib/store";
import { TOKENS } from "@/lib/tokens";
import { price } from "@/lib/format";

/** Scrolling component-price strip under the header. */
export function Ticker() {
  const { prices } = useStore();
  const row = TOKENS.map((token) => {
    const live = prices[token.symbol] ?? token.spot;
    const change = ((live - token.spot) / token.spot) * 100;
    return { ...token, live, change };
  });

  return (
    <div className="relative overflow-hidden border-b border-white/[0.06] bg-ink-800/50">
      <div className="flex w-max animate-marquee gap-8 py-2.5">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 gap-8" aria-hidden={copy === 1}>
            {row.map((token) => (
              <span key={`${copy}-${token.symbol}`} className="flex items-center gap-2 text-xs">
                <span style={{ color: token.tint }}>{token.glyph}</span>
                <span className="font-semibold text-mist-300">{token.symbol}</span>
                <span className="num text-mist-500">{price(token.live)}</span>
                <span className={`num ${token.change >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                  {token.change >= 0 ? "+" : ""}
                  {token.change.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
