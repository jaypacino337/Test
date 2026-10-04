"use client";

import { useStats } from "@/components/Live";

const LABEL = { live: "Bot live", "dry-run": "Bot in dry run", offline: "Bot not reporting" } as const;

export function StatusBadge() {
  const { status } = useStats();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-1 normal-case tracking-normal">
      <span className={`relative size-1.5 rounded-full ${status === "live" ? "bg-brand" : status === "dry-run" ? "bg-accent" : "bg-muted/50"}`}>
        {status === "live" && <span className="absolute inset-0 animate-ping rounded-full bg-brand motion-reduce:hidden" />}
      </span>
      {LABEL[status]}
    </span>
  );
}
