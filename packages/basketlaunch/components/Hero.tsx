"use client";

import Link from "next/link";
import { changePct, marketCapUsd, priceHistory, priceUsd } from "@/lib/baskets";
import { graduationProgress } from "@/lib/curve";
import { compact, price, usd } from "@/lib/format";
import { useStore } from "@/lib/store";
import { BasketMark } from "./BasketMark";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";

export function Hero() {
  const { baskets, trades } = useStore();
  const featured = [...baskets].sort((a, b) => changePct(b) - changePct(a))[0];

  const totalCap = baskets.reduce((sum, basket) => sum + marketCapUsd(basket), 0);
  const graduated = baskets.filter((basket) => graduationProgress(basket.curve) >= 1).length;
  const holders = baskets.reduce((sum, basket) => sum + basket.holders, 0);

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-fade-up">
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-breathe" />
            Public beta · simulated markets
          </span>

          <h1 className="headline mt-6 text-5xl font-semibold text-mist-100 sm:text-6xl lg:text-7xl">
            Launch a <span className="text-gradient">basket</span>,<br />
            not another single coin.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-mist-300 sm:text-lg">
            Pick your sleeves, set the weights, deploy in one click. BasketLaunch mints a single
            token backed by the whole basket and prices it on a bonding curve — with trading fees
            flowing straight back into the basket&apos;s rebalance vault.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/launch" className="btn-primary px-6 py-3 text-base">
              Launch a basket
            </Link>
            <Link href="#explore" className="btn-ghost px-6 py-3 text-base">
              Explore live baskets
            </Link>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            <Stat label="Baskets" value={String(baskets.length)} />
            <Stat label="Total mcap" value={usd(totalCap)} />
            <Stat label="Graduated" value={String(graduated)} />
            <Stat label="Holders" value={compact(holders)} />
          </dl>
        </div>

        {featured ? (
          <div className="animate-fade-up [animation-delay:120ms]">
            <div className="panel relative overflow-hidden p-6 shadow-panel">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-lime-400/12 blur-3xl" />

              <div className="flex items-center justify-between">
                <span className="label">Top mover right now</span>
                <span className="chip text-[10px]">{trades.length} trades tracked</span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <BasketMark basket={featured} size={56} />
                <div className="min-w-0">
                  <div className="font-display text-xl font-semibold text-mist-100">
                    {featured.name}
                  </div>
                  <div className="num text-sm text-mist-500">${featured.ticker}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="num text-lg text-mist-100">{price(priceUsd(featured))}</div>
                  <Delta value={changePct(featured)} />
                </div>
              </div>

              <div className="mt-5">
                <Sparkline
                  values={priceHistory(featured, 48)}
                  width={520}
                  height={92}
                  fluid
                  positive={changePct(featured) >= 0}
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
                {featured.components.slice(0, 3).map((component) => (
                  <div key={component.symbol}>
                    <div className="num text-sm text-mist-100">{component.symbol}</div>
                    <div className="text-[11px] text-mist-500">{component.weight}% weight</div>
                  </div>
                ))}
              </div>

              <Link href={`/basket/${featured.slug}`} className="btn-ghost mt-5 w-full py-2.5">
                Open basket
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className="num mt-1 text-xl text-mist-100">{value}</dd>
    </div>
  );
}
