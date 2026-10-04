"use client";

import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/fx/Reveal";
import { useStats } from "@/components/Live";
import { fmtSol, short } from "@/lib/format";
import { SectionHead } from "./SectionHead";

export function Ledger() {
  const { recent } = useStats();
  return (
    <section id="ledger" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-28 sm:px-6">
      <SectionHead kicker="The ledger" title={<>The latest arrows, <em className="text-gild">on the record</em>.</>} lede="Each row is a confirmed transfer you can open on Solscan." />
      <Reveal className="mt-14 md:ml-[180px]">
        {recent.length === 0 ? (
          <div className="border border-dashed border-line p-8">
            <p className="font-display text-2xl">No volleys yet.</p>
            <p className="mt-2 text-sm text-muted">The first payouts are listed here after the first live cycle.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line border-y border-line font-mono text-sm">
            <AnimatePresence initial={false}>
              {recent.map((r) => (
                <motion.li
                  key={`${r.signature}-${r.owner}`}
                  layout
                  initial={{ opacity: 0, y: -8, backgroundColor: "rgb(201 162 74 / 0.15)" }}
                  animate={{ opacity: 1, y: 0, backgroundColor: "rgb(201 162 74 / 0)" }}
                  transition={{ duration: 0.9 }}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <span className="text-fg/90">{short(r.owner)}</span>
                  <span className="text-right tabular-nums sm:text-left">{fmtSol(r.sol)}</span>
                  {r.signature ? (
                    <a href={`https://solscan.io/tx/${r.signature}`} target="_blank" rel="noopener noreferrer" className="col-span-2 text-accent hover:underline sm:col-span-1">
                      {r.status === "sent" ? "tx" : r.status} ↗
                    </a>
                  ) : (
                    <span className="text-muted">{r.status}</span>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Reveal>
    </section>
  );
}
