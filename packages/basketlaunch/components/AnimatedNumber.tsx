"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tweens between values and tints green/red in the direction of travel.
 * The first render emits the raw value so SSR and hydration agree; animation
 * only starts once mounted.
 */
export function AnimatedNumber({
  value,
  format,
  className = "",
  duration = 420,
}: {
  value: number;
  format: (value: number) => string;
  className?: string;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const fromRef = useRef(value);
  const frameRef = useRef<number>();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      fromRef.current = value;
      setShown(value);
      return;
    }
    const from = fromRef.current;
    if (from === value) return;

    setDirection(value > from ? "up" : "down");
    const start = performance.now();

    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(from + (value - from) * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
      else fromRef.current = value;
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  useEffect(() => {
    if (!direction) return;
    const timer = window.setTimeout(() => setDirection(null), 700);
    return () => window.clearTimeout(timer);
  }, [direction]);

  return (
    <span
      className={`${className} ${direction === "up" ? "tick-up" : direction === "down" ? "tick-down" : ""}`}
    >
      {format(shown)}
    </span>
  );
}
