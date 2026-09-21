"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ASSET_BY_SYMBOL, assetPrice, quoteSwap } from "@/lib/swap";
import { quantity, usd } from "@/lib/format";
import { useStore } from "@/lib/store";
import { RouteView } from "./RouteView";
import { TokenSelect } from "./TokenSelect";

const SLIPPAGE_PRESETS = [10, 50, 100];

export function SwapCard() {
  const { wallet, connect, prices, balanceOf, swap } = useStore();

  const [from, setFrom] = useState("SOL");
  const [to, setTo] = useState("KITN");
  const [amount, setAmount] = useState("1");
  const [slippageBps, setSlippageBps] = useState(50);
  const [showSettings, setShowSettings] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // The popover sits over the form, so it has to be dismissable without
  // hunting for the gear again.
  useEffect(() => {
    if (!showSettings) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) setShowSettings(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowSettings(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [showSettings]);

  const parsed = Number.parseFloat(amount);
  const amountIn = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  const balance = balanceOf(from);

  const quote = useMemo(
    () => quoteSwap(from, to, amountIn, prices, slippageBps),
    [from, to, amountIn, prices, slippageBps],
  );

  const insufficient = amountIn > balance;
  const canSwap = wallet.connected && amountIn > 0 && !insufficient && !!quote;
  const impactPct = (quote?.priceImpact ?? 0) * 100;
  const impactTone = impactPct > 5 ? "text-rose-400" : impactPct > 1.5 ? "text-amber-400" : "text-mist-100";

  function flip() {
    setFrom(to);
    setTo(from);
    setAmount("");
  }

  function pickFrom(symbol: string) {
    if (symbol === to) flip();
    else setFrom(symbol);
  }

  function pickTo(symbol: string) {
    if (symbol === from) flip();
    else setTo(symbol);
  }

  function execute() {
    if (!canSwap) return;
    const done = swap(from, to, amountIn, slippageBps);
    if (!done) return;
    setFlash(`Swapped ${quantity(done.amountIn)} ${from} → ${quantity(done.amountOut)} ${to}`);
    setAmount("");
    window.setTimeout(() => setFlash(null), 3600);
  }

  return (
    <div className="panel relative p-5 shadow-panel">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-mist-100">Swap</h2>
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings((open) => !open)}
            className="chip hover:border-lime-400/40 hover:text-lime-300"
            aria-expanded={showSettings}
          >
            <span aria-hidden>⚙</span>
            <span className="num">{(slippageBps / 100).toFixed(2)}%</span>
          </button>

          {showSettings ? (
            <div className="panel absolute right-0 top-10 z-20 w-60 bg-ink-800/95 p-4">
              <div className="label">Max slippage</div>
              <div className="mt-2 flex gap-1.5">
                {SLIPPAGE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSlippageBps(preset)}
                    className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                      slippageBps === preset
                        ? "bg-lime-400 text-ink-900"
                        : "border border-white/10 text-mist-500 hover:text-mist-100"
                    }`}
                  >
                    {preset / 100}%
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={5000}
                value={slippageBps}
                onChange={(event) =>
                  setSlippageBps(Math.max(1, Math.min(5000, Number(event.target.value) || 1)))
                }
                className="field mt-2 py-2 text-sm"
                aria-label="Custom slippage in basis points"
              />
              <p className="mt-2 text-[11px] leading-relaxed text-mist-700">
                In basis points. The trade reverts if you would receive less than the minimum.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="relative mt-4">
        <Side
          label="You pay"
          symbol={from}
          onSymbol={pickFrom}
          balance={balance}
          valueUsd={amountIn * assetPrice(from, prices)}
          onMax={() => setAmount(String(from === "SOL" ? Math.max(balance - 0.01, 0) : balance))}
        >
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="0.00"
            aria-label={`Amount of ${from} to swap`}
            className="num w-full bg-transparent text-2xl text-mist-100 outline-none placeholder:text-mist-700"
          />
        </Side>

        <div className="relative z-10 -my-2.5 flex justify-center">
          <button
            onClick={flip}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-ink-700 text-mist-300 transition hover:border-lime-400/50 hover:text-lime-300"
            aria-label="Switch direction"
          >
            ↓
          </button>
        </div>

        <Side
          label="You receive"
          symbol={to}
          onSymbol={pickTo}
          balance={balanceOf(to)}
          valueUsd={quote?.valueOutUsd ?? 0}
        >
          <div className="num w-full truncate text-2xl text-mist-100">
            {quote ? quantity(quote.amountOut) : <span className="text-mist-700">0.00</span>}
          </div>
        </Side>
      </div>

      {quote ? (
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-ink-800/40 p-4">
          <Row
            label="Rate"
            value={`1 ${from} = ${quantity(quote.rate)} ${to}`}
          />
          <Row label="Price impact" value={`${impactPct.toFixed(2)}%`} tone={impactTone} />
          <Row
            label={`Min received (${(slippageBps / 100).toFixed(2)}%)`}
            value={`${quantity(quote.minReceived)} ${to}`}
          />
          <Row label="LP fee" value={usd(quote.feeUsd)} muted />
          <div className="mt-2 flex items-start justify-between gap-4 border-t border-white/[0.06] pt-2.5">
            <span className="text-xs text-mist-500">Route</span>
            <RouteView route={quote.route} />
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-white/[0.07] bg-ink-800/40 px-4 py-6 text-center text-sm text-mist-700">
          {from === to ? "Pick two different tokens." : "Enter an amount to see a quote."}
        </p>
      )}

      {impactPct > 5 ? (
        <p className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/5 px-4 py-2.5 text-xs text-rose-400">
          High price impact — this trade is large relative to the pool.
        </p>
      ) : null}

      {flash ? (
        <p className="mt-3 animate-flash rounded-xl border border-lime-400/30 px-4 py-2.5 text-sm text-lime-300">
          {flash}
        </p>
      ) : null}

      {wallet.connected ? (
        <button onClick={execute} disabled={!canSwap} className="btn-primary mt-4 w-full py-3.5 text-base">
          {from === to
            ? "Select a different token"
            : insufficient
              ? `Not enough ${from}`
              : amountIn <= 0
                ? "Enter an amount"
                : !quote
                  ? "No route found"
                  : "Swap"}
        </button>
      ) : (
        <button onClick={connect} className="btn-primary mt-4 w-full py-3.5 text-base">
          Connect wallet
        </button>
      )}

      <p className="mt-3 text-center text-[11px] text-mist-700">
        Simulated routing across {""}
        <span className="num">{quote?.route.path.length ?? 2}</span>-leg paths. No mainnet calls.
      </p>
    </div>
  );
}

function Side({
  label,
  symbol,
  onSymbol,
  balance,
  valueUsd,
  onMax,
  children,
}: {
  label: string;
  symbol: string;
  onSymbol: (symbol: string) => void;
  balance: number;
  valueUsd: number;
  onMax?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl2 border border-white/[0.07] bg-ink-800/60 p-4">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="num text-[11px] text-mist-500">
          balance {quantity(balance)} {symbol}
          {onMax && balance > 0 ? (
            <button
              onClick={onMax}
              className="ml-2 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-lime-300 hover:border-lime-400/40"
            >
              MAX
            </button>
          ) : null}
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-3">
        {children}
        <TokenSelect value={symbol} onChange={onSymbol} />
      </div>
      <div className="num mt-1.5 text-xs text-mist-700">{valueUsd > 0 ? usd(valueUsd) : "—"}</div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-xs ${muted ? "text-mist-700" : "text-mist-500"}`}>{label}</span>
      <span className={`num text-sm ${tone ?? (muted ? "text-mist-700" : "text-mist-100")}`}>
        {value}
      </span>
    </div>
  );
}
