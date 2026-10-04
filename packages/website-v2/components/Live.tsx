"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { SiteStats } from "@/lib/stats";

const Ctx = createContext<SiteStats | null>(null);

/** Server-rendered stats, refreshed from /api/stats every 30s while the tab is visible. */
export function LiveProvider({ initial, children }: { initial: SiteStats; children: React.ReactNode }) {
  const [stats, setStats] = useState(initial);
  useEffect(() => {
    let stop = false;
    const poll = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (res.ok && !stop) setStats(await res.json());
      } catch {
        /* keep the last good numbers */
      }
    };
    const id = setInterval(poll, 30_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);
  return <Ctx.Provider value={stats}>{children}</Ctx.Provider>;
}

export function useStats(): SiteStats {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStats outside LiveProvider");
  return s;
}

/** mm:ss until `target`, rendered only after mount (no hydration mismatch). null → "—". */
export function useCountdown(target: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target || now === null) return "—";
  const ms = Date.parse(target) - now;
  if (ms <= 0) return "loosing…";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
