"use client";

import { useRef } from "react";

/** Card with a soft gold light that follows the cursor, and a lift on hover. */
export function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
        ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={`group relative overflow-hidden border border-line bg-surface/70 transition duration-500 ease-out-expo hover:-translate-y-1 hover:border-accent/40 ${className ?? ""}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: "radial-gradient(320px circle at var(--mx) var(--my), rgb(201 162 74 / 0.12), transparent 70%)" }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
