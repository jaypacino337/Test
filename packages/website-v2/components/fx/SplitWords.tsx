"use client";

import { motion, useReducedMotion } from "motion/react";
import { Fragment } from "react";

/** Headline that rises in word by word. `accent` words get the gold italic treatment. */
export function SplitWords({ text, accent = [], className, delay = 0 }: { text: string; accent?: string[]; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => {
        const gold = accent.includes(w.replace(/[.,]/g, ""));
        const inner = <span className={gold ? "text-gild italic" : undefined}>{w}</span>;
        return (
          <Fragment key={i}>
          <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            {reduce ? (
              <span className="inline-block">{inner}</span>
            ) : (
              <motion.span
                className="inline-block"
                initial={{ y: "105%", rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: delay + i * 0.06 }}
              >
                {inner}
              </motion.span>
            )}
          </span>
          {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </span>
  );
}
