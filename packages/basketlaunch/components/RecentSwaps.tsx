"use client";

import { ASSET_BY_SYMBOL } from "@/lib/swap";
import { quantity, timeAgo } from "@/lib/format";
import { useStore } from "@/lib/store";

export function RecentSwaps() {
  const { swaps, now } = useStore();

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-mist-100">Your swaps</h3>
        <span className="chip text-[10px]">{swaps.length}</span>
      </div>

      {swaps.length ? (
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {swaps.map((swap) => (
            <li key={swap.id} className="flex items-center gap-2 py-2.5 text-sm">
              <span className="num text-mist-100">
                {quantity(swap.amountIn)}{" "}
                <span style={{ color: ASSET_BY_SYMBOL[swap.from]?.tint }}>{swap.from}</span>
              </span>
              <span className="text-mist-700" aria-hidden>
                →
              </span>
              <span className="num text-mist-100">
                {quantity(swap.amountOut)}{" "}
                <span style={{ color: ASSET_BY_SYMBOL[swap.to]?.tint }}>{swap.to}</span>
              </span>
              <span className="num ml-auto text-[11px] text-mist-700">{timeAgo(swap.at, now)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-mist-500">
          No swaps yet. Your fills show up here with the route they took.
        </p>
      )}
    </div>
  );
}
