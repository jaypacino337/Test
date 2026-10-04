"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` when scrolled into view. null renders "—": the page
 * never invents a number.
 */
export function Counter({ value, format }: { value: number | null; format: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  const last = useRef(0);

  useEffect(() => {
    if (value === null || !inView) return;
    if (reduce) {
      setShown(value);
      last.current = value;
      return;
    }
    const controls = animate(last.current, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
      onComplete: () => (last.current = value),
    });
    return () => controls.stop();
  }, [value, inView, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {value === null ? "—" : format(shown)}
    </span>
  );
}
