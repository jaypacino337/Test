"use client";

import { ASSET_BY_SYMBOL, POOLS, assetPrice } from "@/lib/swap";
import { usd } from "@/lib/format";
import { useStore } from "@/lib/store";

/** Deepest pools in the simulated graph — the routes quotes actually use. */
export function PoolList({ limit = 8 }: { limit?: number }) {
  const { prices } = useStore();
  const rows = [...POOLS].sort((a, b) => b.depthUsd - a.depthUsd).slice(0, limit);

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-mist-100">Deepest pools</h3>
        <span className="chip text-[10px]">{POOLS.length} total</span>
      </div>

      <ul className="mt-3 divide-y divide-white/[0.06]">
        {rows.map((pool) => {
          const a = ASSET_BY_SYMBOL[pool.a];
          const b = ASSET_BY_SYMBOL[pool.b];
          return (
            <li key={`${pool.a}-${pool.b}`} className="flex items-center gap-3 py-2.5">
              <span className="flex -space-x-1.5" aria-hidden>
                <span
                  className="grid h-6 w-6 place-items-center rounded-full border border-ink-800 text-[10px]"
                  style={{ backgroundColor: `${a?.tint}2e`, color: a?.tint }}
                >
                  {a?.glyph}
                </span>
                <span
                  className="grid h-6 w-6 place-items-center rounded-full border border-ink-800 text-[10px]"
                  style={{ backgroundColor: `${b?.tint}2e`, color: b?.tint }}
                >
                  {b?.glyph}
                </span>
              </span>
              <span className="num text-sm text-mist-100">
                {pool.a}/{pool.b}
              </span>
              <span className="num ml-auto text-sm text-mist-300">{usd(pool.depthUsd)}</span>
              <span className="num w-12 text-right text-[11px] text-mist-700">
                {pool.feeBps / 100}%
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] leading-relaxed text-mist-700">
        Reserves are derived from each pool&apos;s USD depth and the live simulated prices, so
        quotes move with the market instead of drifting away from it.
      </p>
    </div>
  );
}
