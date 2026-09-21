"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Composition } from "@/components/Composition";
import { CopyButton } from "@/components/CopyButton";
import { Delta } from "@/components/Delta";
import { PriceChart } from "@/components/PriceChart";
import { BasketMark } from "@/components/BasketMark";
import { StatTile } from "@/components/StatTile";
import { TradePanel } from "@/components/TradePanel";
import { TradesFeed } from "@/components/TradesFeed";
import { SOL_USD, changePct, marketCapUsd, navUsd, priceHistory, priceUsd } from "@/lib/baskets";
import { GRADUATION_SOL, TOTAL_SUPPLY, graduationProgress, hasGraduated } from "@/lib/curve";
import { compact, price, shortAddress, sol, timeAgo, usd } from "@/lib/format";
import { SECTOR_LABELS } from "@/lib/tokens";
import { useStore } from "@/lib/store";

export default function BasketPage({ params }: { params: { slug: string } }) {
  const { baskets, prices, now } = useStore();
  const basket = baskets.find((entry) => entry.slug === params.slug);

  const history = useMemo(
    () => (basket ? priceHistory(basket, 72) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [basket?.slug, basket?.curve.realSol, basket?.curve.tokensSold],
  );

  if (!basket) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6">
        <h1 className="headline text-4xl font-semibold text-mist-100">Basket not found</h1>
        <p className="mt-3 text-sm text-mist-500">
          This basket doesn&apos;t exist in the beta — it may have been launched in another browser.
        </p>
        <Link href="/" className="btn-primary mt-7 px-6 py-3">
          Back to explore
        </Link>
      </div>
    );
  }

  const change = changePct(basket);
  const progress = graduationProgress(basket.curve);
  const graduated = hasGraduated(basket.curve);
  const curvePrice = priceUsd(basket);
  // NAV index: 1.00 at launch, drifting with the weighted component prices.
  // The gap against the curve tells you what the market is paying over the sleeves.
  const nav = navUsd(basket, prices);
  const navDrift = (nav - 1) * 100;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-mist-500 hover:text-lime-300">
        ← All baskets
      </Link>

      <header className="mt-5 flex flex-wrap items-start gap-5">
        <BasketMark basket={basket} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="headline text-4xl font-semibold text-mist-100">{basket.name}</h1>
            <span className="num text-mist-500">${basket.ticker}</span>
            <span className="chip">{SECTOR_LABELS[basket.sector]}</span>
            {graduated ? (
              <span className="chip border-aqua-400/40 text-aqua-400">graduated</span>
            ) : null}
            {basket.local ? (
              <span className="chip border-lime-400/40 text-lime-300">launched by you</span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist-500">{basket.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-mist-700">
            <span className="flex items-center gap-1.5">
              mint <span className="num text-mist-500">{shortAddress(basket.mint, 5, 5)}</span>
              <CopyButton value={basket.mint} />
            </span>
            <span>
              creator <span className="num text-mist-500">{shortAddress(basket.creator)}</span>
            </span>
            <span>launched {timeAgo(basket.createdAt, now)} ago</span>
          </div>
        </div>

        <div className="text-right">
          <div className="num text-3xl text-mist-100">{price(curvePrice)}</div>
          <Delta value={change} className="justify-end text-base" />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Market cap" value={usd(marketCapUsd(basket))} sub={`${compact(TOTAL_SUPPLY)} supply`} />
            <StatTile label="Raised" value={sol(basket.curve.realSol, 1)} sub={`of ${GRADUATION_SOL} SOL`} accent />
            <StatTile
              label="NAV index"
              value={nav.toFixed(4)}
              sub={`${navDrift >= 0 ? "+" : ""}${navDrift.toFixed(2)}% vs launch`}
            />
            <StatTile label="Rebalance vault" value={sol(basket.vault, 3)} sub={usd(basket.vault * SOL_USD)} />
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-mist-100">Price</h2>
              <span className="chip text-[11px]">bonding curve · SOL/{basket.ticker}</span>
            </div>
            <div className="mt-4">
              <PriceChart values={history} />
            </div>
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-mist-100">
                {graduated ? "Graduated" : "Graduation progress"}
              </h2>
              <span className="num text-sm text-lime-400">{(progress * 100).toFixed(1)}%</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${graduated ? "bg-aqua-400" : "bg-lime-400"}`}
                style={{ width: `${Math.max(progress * 100, 2)}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-mist-500">
              {graduated
                ? "The curve is closed. In production, the remaining SOL and token reserve would seed an AMM pool and the LP tokens would be burned."
                : `${sol(Math.max(GRADUATION_SOL - basket.curve.realSol, 0), 2)} left before this basket graduates to an AMM pool.`}
            </p>
          </div>

          <Composition basket={basket} />
        </div>

        <div className="space-y-6">
          <TradePanel basket={basket} />
          <TradesFeed slug={basket.slug} limit={10} />
        </div>
      </div>
    </div>
  );
}
