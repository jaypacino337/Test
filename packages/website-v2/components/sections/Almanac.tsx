"use client";

import { ExternalLink } from "lucide-react";
import { Counter } from "@/components/fx/Counter";
import { Reveal, RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { Spotlight } from "@/components/fx/Spotlight";
import { useCountdown, useStats } from "@/components/Live";
import { dash, fmtInt, fmtSol, fmtUsd } from "@/lib/format";
import { SectionHead } from "./SectionHead";

export function Almanac() {
  const s = useStats();
  const countdown = useCountdown(s.nextSnapshotAt);
  const cells = [
    { k: "Returned to holders", v: <Counter value={s.totalDistributedSol} format={fmtSol} />, note: "SOL sent to holder wallets, confirmed on-chain" },
    { k: "Fees harvested", v: <Counter value={s.totalHarvestedSol} format={fmtSol} />, note: "net creator fees claimed from pump.fun" },
    { k: "Holders at last snapshot", v: <Counter value={s.holderCount} format={fmtInt} />, note: "wallets only; pools and programs excluded" },
    { k: "Next volley in", v: <span className="tabular-nums">{countdown}</span>, note: "minutes : seconds" },
  ];
  const market = [
    { k: "Price", v: dash(s.market?.priceUsd, fmtUsd) },
    { k: "Market cap", v: dash(s.market?.marketCapUsd, fmtUsd) },
    { k: "24h volume", v: dash(s.market?.volume24hUsd, fmtUsd) },
    { k: "Liquidity compounded", v: dash(s.totalLpSol, fmtSol) },
    { k: "Purse for next volley", v: dash(s.rewardsQueuedSol, fmtSol) },
  ];

  return (
    <section id="almanac" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-28 sm:px-6">
      <SectionHead
        kicker="The almanac"
        title={<>Every number here is <em className="text-gild">real</em>, or a dash.</>}
        lede={
          s.status === "offline"
            ? "The bot hasn't reported yet, so the figures stay blank rather than invented. They fill in as soon as it does."
            : s.status === "dry-run"
              ? "The bot is in a dry run: it reads the chain and plans each volley without sending. Totals start at the first live cycle."
              : "Read straight from the bot's ledger, refreshed every 30 seconds."
        }
      />
      <RevealGroup className="mt-14 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((c) => (
          <RevealItem key={c.k} className="bg-bg">
            <Spotlight className="h-full border-0 bg-transparent p-6 sm:p-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{c.k}</p>
              <p className="mt-5 font-display text-4xl tracking-tight sm:text-5xl">{c.v}</p>
              <p className="mt-3 text-sm text-muted">{c.note}</p>
            </Spotlight>
          </RevealItem>
        ))}
      </RevealGroup>
      <Reveal className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-line pb-4 font-mono text-xs text-muted">
        {market.map((m) => (
          <span key={m.k}>
            {m.k} <span className="ml-2 text-fg tabular-nums">{m.v}</span>
          </span>
        ))}
        {s.market?.url && (
          <a href={s.market.url} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-accent hover:underline">
            Chart <ExternalLink className="size-3" />
          </a>
        )}
      </Reveal>
    </section>
  );
}
