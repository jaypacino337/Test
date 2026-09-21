"use client";

import Link from "next/link";
import { BasketMark } from "@/components/BasketMark";
import { Delta } from "@/components/Delta";
import { StatTile } from "@/components/StatTile";
import { SOL_USD } from "@/lib/baskets";
import { spotPrice } from "@/lib/curve";
import { compact, price, sol, usd } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PortfolioPage() {
  const { positions, baskets, wallet, connect, reset } = useStore();

  const rows = positions
    .map((position) => {
      const basket = baskets.find((entry) => entry.slug === position.slug);
      if (!basket) return null;
      const valueSol = position.tokens * spotPrice(basket.curve);
      const pnlSol = valueSol - position.costSol;
      const pnlPct = position.costSol > 0 ? (pnlSol / position.costSol) * 100 : 0;
      return { basket, position, valueSol, pnlSol, pnlPct };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.valueSol - a.valueSol);

  const totalValueSol = rows.reduce((sum, row) => sum + row.valueSol, 0);
  const totalCostSol = rows.reduce((sum, row) => sum + row.position.costSol, 0);
  const totalPnlSol = totalValueSol - totalCostSol;
  const mine = baskets.filter((basket) => basket.local);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="headline text-4xl font-semibold text-mist-100">Portfolio</h1>
          <p className="mt-2 text-sm text-mist-500">
            Positions and baskets from this browser. Simulated, and yours alone.
          </p>
        </div>
        {wallet.connected ? (
          <button onClick={reset} className="btn-ghost px-4 py-2 text-xs">
            Reset demo state
          </button>
        ) : null}
      </header>

      {!wallet.connected ? (
        <div className="panel mt-8 px-6 py-16 text-center">
          <p className="font-display text-xl text-mist-100">Connect to see your positions</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-mist-500">
            The beta hands you a simulated wallet with a starting SOL balance — no extension, no
            signature, no risk.
          </p>
          <button onClick={connect} className="btn-primary mt-6 px-6 py-3">
            Connect wallet
          </button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Portfolio value" value={usd(totalValueSol * SOL_USD)} sub={sol(totalValueSol, 3)} accent />
            <StatTile label="Cost basis" value={usd(totalCostSol * SOL_USD)} sub={sol(totalCostSol, 3)} />
            <StatTile
              label="Unrealised P&L"
              value={`${totalPnlSol >= 0 ? "+" : "-"}${usd(Math.abs(totalPnlSol) * SOL_USD)}`}
              sub={sol(totalPnlSol, 4)}
            />
            <StatTile label="Wallet SOL" value={sol(wallet.solBalance, 3)} sub={usd(wallet.solBalance * SOL_USD)} />
          </div>

          <section className="mt-8">
            <h2 className="font-display text-lg font-semibold text-mist-100">Positions</h2>
            {rows.length ? (
              <div className="panel mt-3 divide-y divide-white/[0.06]">
                {rows.map((row) => (
                  <Link
                    key={row.basket.slug}
                    href={`/basket/${row.basket.slug}`}
                    className="flex flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
                  >
                    <BasketMark basket={row.basket} size={38} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-mist-100">
                        {row.basket.name}
                      </div>
                      <div className="num text-xs text-mist-500">
                        {compact(row.position.tokens)} ${row.basket.ticker}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num text-sm text-mist-100">{price(spotPrice(row.basket.curve) * SOL_USD)}</div>
                      <div className="num text-[11px] text-mist-700">mark price</div>
                    </div>
                    <div className="w-28 text-right">
                      <div className="num text-sm text-mist-100">{usd(row.valueSol * SOL_USD)}</div>
                      <Delta value={row.pnlPct} className="justify-end text-xs" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="panel mt-3 px-6 py-12 text-center text-sm text-mist-500">
                No positions yet.{" "}
                <Link href="/" className="text-lime-300 hover:underline">
                  Go buy a basket.
                </Link>
              </p>
            )}
          </section>

          <section className="mt-10">
            <h2 className="font-display text-lg font-semibold text-mist-100">Baskets you launched</h2>
            {mine.length ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mine.map((basket) => (
                  <Link
                    key={basket.slug}
                    href={`/basket/${basket.slug}`}
                    className="panel panel-hover flex items-center gap-3 p-4"
                  >
                    <BasketMark basket={basket} size={40} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-mist-100">{basket.name}</div>
                      <div className="num text-xs text-mist-500">
                        ${basket.ticker} · {sol(basket.curve.realSol, 2)} raised
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="panel mt-3 px-6 py-12 text-center text-sm text-mist-500">
                Nothing launched yet.{" "}
                <Link href="/launch" className="text-lime-300 hover:underline">
                  Compose your first basket.
                </Link>
              </p>
            )}
          </section>
        </>
      )}

    </div>
  );
}
