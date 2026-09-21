"use client";

import { useMemo, useState } from "react";
import { Basket, SOL_USD } from "@/lib/baskets";
import { GRADUATION_SOL, hasGraduated, quoteBuy, quoteSell, spotPrice } from "@/lib/curve";
import { compact, price, sol, usd } from "@/lib/format";
import { useStore } from "@/lib/store";

const SOL_PRESETS = [0.1, 0.5, 1, 5];
const SELL_PRESETS = [0.25, 0.5, 1];

export function TradePanel({ basket }: { basket: Basket }) {
  const { wallet, connect, buy, sell, positionFor } = useStore();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0.5");
  const [flash, setFlash] = useState<string | null>(null);

  const position = positionFor(basket.slug);
  const parsed = Number.parseFloat(amount);
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

  const quote = useMemo(
    () => (side === "buy" ? quoteBuy(basket.curve, value) : quoteSell(basket.curve, value)),
    [basket.curve, side, value],
  );

  const graduated = hasGraduated(basket.curve);
  const insufficientSol = side === "buy" && value > wallet.solBalance;
  const insufficientTokens = side === "sell" && value > (position?.tokens ?? 0);
  const canTrade = wallet.connected && value > 0 && !insufficientSol && !insufficientTokens;

  function execute() {
    if (!canTrade) return;
    if (side === "buy") buy(basket.slug, value);
    else sell(basket.slug, value);
    setFlash(
      side === "buy"
        ? `Bought ${compact(quote.tokens)} ${basket.ticker}`
        : `Sold ${compact(value)} ${basket.ticker} for ${sol(quote.sol, 4)}`,
    );
    setAmount(side === "buy" ? "0.5" : "0");
    window.setTimeout(() => setFlash(null), 3200);
  }

  return (
    <div className="panel overflow-hidden">
      <div className="grid grid-cols-2 gap-1 border-b border-white/[0.06] p-1.5">
        {(["buy", "sell"] as const).map((option) => (
          <button
            key={option}
            onClick={() => {
              setSide(option);
              setAmount(option === "buy" ? "0.5" : "0");
            }}
            className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
              side === option
                ? option === "buy"
                  ? "bg-lime-400 text-ink-900"
                  : "bg-rose-400 text-ink-900"
                : "text-mist-500 hover:text-mist-100"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-center justify-between">
            <span className="label">{side === "buy" ? "You pay" : "You sell"}</span>
            <span className="num text-[11px] text-mist-500">
              balance{" "}
              {side === "buy"
                ? sol(wallet.solBalance, 3)
                : `${compact(position?.tokens ?? 0)} ${basket.ticker}`}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-white/10 bg-ink-800/70 px-4 py-3 focus-within:border-lime-400/60">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
              inputMode="decimal"
              aria-label={side === "buy" ? "SOL amount to spend" : "Basket tokens to sell"}
              className="num w-full bg-transparent text-lg text-mist-100 outline-none"
            />
            <span className="num shrink-0 text-sm text-mist-500">
              {side === "buy" ? "SOL" : basket.ticker}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {side === "buy"
              ? SOL_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(String(preset))}
                    className="chip hover:border-lime-400/40 hover:text-lime-300"
                  >
                    {preset} SOL
                  </button>
                ))
              : SELL_PRESETS.map((fraction) => (
                  <button
                    key={fraction}
                    onClick={() =>
                      setAmount(String(Math.floor((position?.tokens ?? 0) * fraction)))
                    }
                    className="chip hover:border-rose-400/40 hover:text-rose-400"
                  >
                    {fraction * 100}%
                  </button>
                ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-ink-800/40 p-4 text-sm">
          <Row
            label={side === "buy" ? "You receive" : "You receive"}
            value={
              side === "buy"
                ? `${compact(quote.tokens)} ${basket.ticker}`
                : sol(quote.sol, 4)
            }
            strong
          />
          <Row label="Avg. price" value={price(quote.avgPrice * SOL_USD)} />
          <Row
            label="Price impact"
            value={`${(quote.priceImpact * 100).toFixed(2)}%`}
            tone={Math.abs(quote.priceImpact) > 0.08 ? "warn" : undefined}
          />
          <Row label="Fee (1%)" value={sol(quote.fee, 4)} />
          <Row label="→ rebalance vault" value={sol(quote.vaultCut, 4)} muted />
        </div>

        {flash ? (
          <p className="animate-flash rounded-xl border border-lime-400/30 px-4 py-2.5 text-sm text-lime-300">
            {flash}
          </p>
        ) : null}

        {wallet.connected ? (
          <button
            onClick={execute}
            disabled={!canTrade}
            className={side === "buy" ? "btn-primary w-full py-3" : "btn w-full bg-rose-400 py-3 text-ink-900 hover:brightness-110"}
          >
            {insufficientSol
              ? "Not enough SOL"
              : insufficientTokens
                ? `Not enough ${basket.ticker}`
                : side === "buy"
                  ? `Buy ${basket.ticker}`
                  : `Sell ${basket.ticker}`}
          </button>
        ) : (
          <button onClick={connect} className="btn-primary w-full py-3">
            Connect wallet to trade
          </button>
        )}

        <p className="text-[11px] leading-relaxed text-mist-700">
          {graduated
            ? "This basket has graduated — trades route to its AMM pool in the simulation."
            : `Trades run against the bonding curve until ${GRADUATION_SOL} SOL is raised.`}{" "}
          Simulated execution only.
        </p>

        {position ? (
          <div className="border-t border-white/[0.06] pt-4">
            <div className="label">Your position</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="num text-mist-100">
                {compact(position.tokens)} {basket.ticker}
              </span>
              <span className="num text-mist-500">
                {usd(position.tokens * spotPrice(basket.curve) * SOL_USD)}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  tone?: "warn";
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-xs ${muted ? "text-mist-700" : "text-mist-500"}`}>{label}</span>
      <span
        className={`num text-sm ${
          tone === "warn" ? "text-amber-400" : strong ? "text-lime-400" : muted ? "text-mist-700" : "text-mist-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
