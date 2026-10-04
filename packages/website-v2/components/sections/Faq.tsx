"use client";

import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { site } from "@/lib/site";
import { Reveal } from "@/components/fx/Reveal";
import { SectionHead } from "./SectionHead";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-28 sm:px-6">
      <SectionHead kicker="Questions" title={<>Asked around the <em className="text-gild">fire</em>.</>} />
      <Reveal className="mt-14 md:ml-[180px]">
        <ul className="divide-y divide-line border-y border-line">
          {site.faq.map((f, i) => (
            <li key={f.q}>
              <button
                type="button"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left font-display text-xl sm:text-2xl"
              >
                {f.q}
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="shrink-0 text-accent">
                  <Plus className="size-5" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl pb-6 text-pretty leading-relaxed text-muted">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
