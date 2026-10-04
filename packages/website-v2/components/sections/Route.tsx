"use client";

import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/components/fx/Reveal";
import { useStats } from "@/components/Live";
import { SectionHead } from "./SectionHead";

/** The fee route as the bot reports it (LP_SHARE). Unknown → an empty quiver, not a guess. */
export function Route() {
  const { lpShare } = useStats();
  const reduce = useReducedMotion();
  const lp = lpShare === null ? null : Math.round(lpShare * 100);
  const legs =
    lp === null
      ? null
      : [
          { k: "Liquidity", pct: lp, note: "deepens the ARROW/SOL pool every cycle", color: "bg-brand" },
          { k: "Holders", pct: 100 - lp, note: "airdropped pro-rata in SOL", color: "bg-accent" },
        ];
  return (
    <section id="route" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-28 sm:px-6">
      <SectionHead kicker="Fee route" title={<>Where every claim <em className="text-gild">lands</em>.</>} lede="Read from the bot's live configuration, so it can't drift from what the code actually does." />
      <Reveal className="mt-14 md:ml-[180px]">
        {legs ? (
          <>
            <div className="flex h-14 w-full overflow-hidden border border-line">
              {legs.map((l, i) => (
                <motion.div
                  key={l.k}
                  className={`${l.color} relative h-full`}
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${l.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={reduce ? { width: `${l.pct}%` } : undefined}
                />
              ))}
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {legs.map((l) => (
                <div key={l.k} className="flex items-baseline gap-4 border-t border-line pt-4">
                  <span className="font-display text-5xl tabular-nums">{l.pct}%</span>
                  <span>
                    <span className="block text-fg">{l.k}</span>
                    <span className="text-sm text-muted">{l.note}</span>
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="border border-dashed border-line p-8 text-muted">
            <p className="font-display text-3xl text-fg">—</p>
            <p className="mt-2 text-sm">The split appears once the bot reports its configuration.</p>
          </div>
        )}
      </Reveal>
    </section>
  );
}
