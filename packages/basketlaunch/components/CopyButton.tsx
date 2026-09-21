"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (insecure context, permissions) — fail quietly.
    }
  }

  return (
    <button
      onClick={copy}
      className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium text-mist-500 transition hover:border-lime-400/40 hover:text-lime-300"
      aria-label={`${label} ${value}`}
    >
      {copied ? "copied" : label}
    </button>
  );
}
