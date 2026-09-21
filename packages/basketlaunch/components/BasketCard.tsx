import Link from "next/link";
import { Basket, changePct, marketCapUsd, priceHistory, priceUsd } from "@/lib/baskets";
import { GRADUATION_SOL, graduationProgress, hasGraduated } from "@/lib/curve";
import { compact, price, sol, usd } from "@/lib/format";
import { SECTOR_LABELS } from "@/lib/tokens";
import { AnimatedNumber } from "./AnimatedNumber";
import { BasketMark } from "./BasketMark";
import { Delta } from "./Delta";
import { Sparkline } from "./Sparkline";

export function BasketCard({ basket }: { basket: Basket }) {
  const change = changePct(basket);
  const progress = graduationProgress(basket.curve);
  const graduated = hasGraduated(basket.curve);

  return (
    <Link
      href={`/basket/${basket.slug}`}
      className="panel panel-hover group flex h-full flex-col gap-4 p-5"
    >
      <div className="flex items-start gap-3">
        <BasketMark basket={basket} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-semibold text-mist-100">
              {basket.name}
            </span>
            <span className="num text-xs text-mist-500">${basket.ticker}</span>
          </div>
          <p className="mt-1 line-clamp-2 min-h-[2.1rem] text-xs leading-relaxed text-mist-500">
            {basket.tagline}
          </p>
        </div>
        {basket.local ? (
          <span className="chip border-lime-400/40 text-lime-300">yours</span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {basket.components.slice(0, 4).map((component) => (
          <span key={component.symbol} className="chip px-2 py-0.5 text-[11px]">
            {component.symbol}
            <span className="num text-mist-500">{component.weight}%</span>
          </span>
        ))}
        {basket.components.length > 4 ? (
          <span className="chip px-2 py-0.5 text-[11px] text-mist-500">
            +{basket.components.length - 4}
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3">
        <div>
          <AnimatedNumber
            value={priceUsd(basket)}
            format={price}
            className="num block text-lg text-mist-100"
          />
          <Delta value={change} />
        </div>
        <Sparkline values={priceHistory(basket, 28)} positive={change >= 0} />
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] text-mist-500">
          <span>{graduated ? "Graduated to AMM" : "Bonding curve"}</span>
          <span className="num">
            {graduated ? "100%" : `${sol(basket.curve.realSol, 1)} / ${GRADUATION_SOL}`}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              graduated ? "bg-aqua-400" : "bg-lime-400"
            }`}
            style={{ width: `${Math.max(progress * 100, 2)}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-mist-500">
        <span>{SECTOR_LABELS[basket.sector]}</span>
        <span className="num">mcap {usd(marketCapUsd(basket))}</span>
        <span className="num">{compact(basket.holders)} holders</span>
      </div>
    </Link>
  );
}
