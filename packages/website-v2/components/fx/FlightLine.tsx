"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

/**
 * The flight path through "the loop": a dashed track that fills with gold as
 * you scroll through the section, an arrow riding the leading edge.
 */
export function FlightLine({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 22 });
  const p = useTransform(progress, (v) => (reduce ? 1 : Math.min(1, Math.max(0, v))));
  const top = useTransform(p, (v) => `${v * 100}%`);

  return (
    <div ref={ref} aria-hidden className={`relative ${className ?? ""}`}>
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,var(--color-line)_0_3px,transparent_3px_10px)]" />
      <motion.div className="absolute left-1/2 top-0 w-px -translate-x-1/2 origin-top bg-accent" style={{ height: top }} />
      <motion.div className="absolute left-1/2 -translate-x-1/2 -translate-y-full" style={{ top }}>
        <svg width="18" height="44" viewBox="0 0 18 44" className="text-accent">
          <path d="M9 0v34" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 44 3 32h12z" fill="currentColor" />
          <path d="M9 2 3 -4M9 2l6-6M9 8 3 2M9 8l6-6" stroke="#3f7a59" strokeWidth="1.5" />
        </svg>
      </motion.div>
    </div>
  );
}
