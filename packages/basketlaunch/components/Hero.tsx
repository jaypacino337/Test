"use client";

import Link from "next/link";
import { changePct, marketCapUsd, priceHistory, priceUsd } from "@/lib/baskets";
import { graduationProgress } from "@/lib/curve";
import { compact, price, usd } from "@/lib/format";
import { useStore } from "@/lib/store";
import { AnimatedNumber } from "./AnimatedNumber";
import { BasketOrbit } from "./BasketOrbit";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";

export function Hero() {
  const { baskets } = useStore();
  const featured = [...baskets].sort((a, b) => changePct(b) - changePct(a))[0];

  const totalCap = baskets.reduce((sum, basket) => sum + marketCapUsd(basket), 0);
  const graduated = baskets.filter((basket) => graduationProgress(basket.curve) >= 1).length;
  const holders = baskets.reduce((sum, basket) => sum + basket.holders, 0);

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-[1.16fr_0.84fr]">
        <div>
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-breathe" />
            Public beta · simulated markets
          </span>

          <h1 className="headline mt-7 text-[3rem] text-mist-100 sm:text-6xl lg:text-[4.5rem]">
            Launch a <span className="text-gradient">basket</span>,<br />
            not another coin.
          </h1>

          <p className="mt-7 max-w-lg text-base leading-relaxed text-mist-300 sm:text-lg">
            Pick your sleeves, set the weights, deploy in one click. One token backed by the whole
            basket, priced on a bonding curve — with fees flowing back into the basket itself.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/launch" className="btn-primary px-7 py-3.5 text-base">
              Launch a basket
            </Link>
            <Link href="/swap" className="btn-ghost px-7 py-3.5 text-base">
              Swap tokens
            </Link>
          </div>

          <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-6 border-t border-white/[0.07] pt-8 sm:grid-cols-4">
            <Stat label="Baskets" value={String(baskets.length)} />
            <Stat label="Total mcap" value={usd(totalCap)} live={totalCap} format={usd} />
            <Stat label="Graduated" value={String(graduated)} />
            <Stat label="Holders" value={compact(holders)} />
          </dl>
        </div>

        {featured ? (
          <div className="relative">
            <BasketOrbit basket={featured} />

            <div className="panel mx-auto -mt-4 max-w-sm p-4">
              <div className="flex items-center justify-between">
                <span className="label">Top mover</span>
                <Link
                  href={`/basket/${featured.slug}`}
                  className="text-[11px] text-mist-500 transition hover:text-lime-300"
                >
                  open →
                </Link>
              </div>

              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate font-display text-lg font-semibold text-mist-100">
                    {featured.name}
                  </div>
                  <div className="num text-xs text-mist-500">${featured.ticker}</div>
                </div>
                <div className="text-right">
                  <AnimatedNumber
                    value={priceUsd(featured)}
                    format={price}
                    className="num block text-base text-mist-100"
                  />
                  <Delta value={changePct(featured)} className="justify-end text-xs" />
                </div>
              </div>

              <div className="mt-3">
                <Sparkline
                  values={priceHistory(featured, 44)}
                  width={420}
                  height={54}
                  fluid
                  positive={changePct(featured) >= 0}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  live,
  format,
}: {
  label: string;
  value: string;
  live?: number;
  format?: (value: number) => string;
}) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="num mt-1.5 text-xl text-mist-100">
        {live !== undefined && format ? (
          <AnimatedNumber value={live} format={format} />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
