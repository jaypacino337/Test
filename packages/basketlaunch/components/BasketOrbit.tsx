"use client";

import { Basket } from "@/lib/baskets";
import { TOKEN_BY_SYMBOL } from "@/lib/tokens";

/**
 * The hero centrepiece: the basket's weight wheel at the core, with its
 * component tokens orbiting around it. Each sleeve gets its own ring, speed
 * and phase, so the motion reads as a system rather than a spinner.
 */
export function BasketOrbit({ basket }: { basket: Basket }) {
  // Three rings only: more than that crowds the core, and the orbiting chips
  // need enough inset that they never swing past the container at phone width.
  const sleeves = basket.components.slice(0, 3);

  let cursor = 0;
  const stops = basket.components.map((component) => {
    const tint = TOKEN_BY_SYMBOL[component.symbol]?.tint ?? "#7E8B9E";
    const from = cursor;
    cursor += component.weight;
    return `${tint} ${from}% ${cursor}%`;
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[420px]" aria-hidden>
      <div className="absolute inset-[14%] rounded-full bg-lime-400/10 blur-3xl" />

      {sleeves.map((component, index) => {
        const token = TOKEN_BY_SYMBOL[component.symbol];
        const inset = 11 + index * 8;
        const duration = 26 + index * 7;
        const reverse = index % 2 === 1;
        return (
          <div
            key={component.symbol}
            className="absolute rounded-full border border-white/[0.06]"
            style={{
              inset: `${inset}%`,
              animation: `orbit-spin ${duration}s linear infinite${reverse ? " reverse" : ""}`,
            }}
          >
            <span
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: `orbit-spin ${duration}s linear infinite${reverse ? "" : " reverse"}` }}
            >
              <span
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-ink-800/90 py-1 pl-1 pr-2.5 backdrop-blur-sm"
                style={{ boxShadow: `0 0 20px -8px ${token?.tint ?? "#7E8B9E"}` }}
              >
                <span
                  className="grid h-5 w-5 place-items-center rounded-full text-[10px]"
                  style={{ backgroundColor: `${token?.tint ?? "#7E8B9E"}2e`, color: token?.tint }}
                >
                  {token?.glyph ?? "◦"}
                </span>
                <span className="num text-[10px] text-mist-300">{component.symbol}</span>
              </span>
            </span>
          </div>
        );
      })}

      <div className="absolute inset-[34%] grid place-items-center">
        <div
          className="relative grid h-full w-full place-items-center rounded-full"
          style={{ background: `conic-gradient(${stops.join(", ")})` }}
        >
          <div className="grid h-[76%] w-[76%] place-items-center rounded-full bg-ink-900 text-center">
            <div>
              <div className="font-display text-lg font-bold leading-none text-mist-100">
                {basket.ticker}
              </div>
              <div className="num mt-1 text-[10px] text-mist-500">
                {basket.components.length} sleeves
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
