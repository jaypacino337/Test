"use client";

import { Basket } from "@/lib/baskets";
import { price } from "@/lib/format";
import { SECTOR_LABELS, TOKEN_BY_SYMBOL } from "@/lib/tokens";
import { useStore } from "@/lib/store";

/** The sleeve breakdown: weight bar + a row per component with its live mark. */
export function Composition({ basket }: { basket: Basket }) {
  const { prices } = useStore();

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-mist-100">Composition</h3>
        <span className="chip">{basket.components.length} sleeves</span>
      </div>

      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        {basket.components.map((component) => (
          <span
            key={component.symbol}
            style={{
              width: `${component.weight}%`,
              backgroundColor: TOKEN_BY_SYMBOL[component.symbol]?.tint ?? "#7E8B9E",
            }}
            title={`${component.symbol} ${component.weight}%`}
          />
        ))}
      </div>

      <ul className="mt-4 divide-y divide-white/[0.06]">
        {basket.components.map((component) => {
          const token = TOKEN_BY_SYMBOL[component.symbol];
          const live = prices[component.symbol] ?? token?.spot ?? 0;
          const change = token ? ((live - token.spot) / token.spot) * 100 : 0;
          return (
            <li key={component.symbol} className="flex items-center gap-3 py-3">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg text-sm"
                style={{ backgroundColor: `${token?.tint ?? "#7E8B9E"}1f`, color: token?.tint }}
                aria-hidden
              >
                {token?.glyph ?? "◦"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-mist-100">{component.symbol}</span>
                  <span className="truncate text-xs text-mist-500">{token?.name}</span>
                </div>
                <div className="text-[11px] text-mist-700">
                  {token ? SECTOR_LABELS[token.sector] : "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="num text-sm text-mist-100">{price(live)}</div>
                <div className={`num text-[11px] ${change >= 0 ? "text-lime-400" : "text-rose-400"}`}>
                  {change >= 0 ? "+" : ""}
                  {change.toFixed(2)}%
                </div>
              </div>
              <div className="num w-12 text-right text-sm text-mist-300">{component.weight}%</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
