"use client";

import { useMemo, useState } from "react";
import { changePct, marketCapUsd } from "@/lib/baskets";
import { graduationProgress } from "@/lib/curve";
import { SECTOR_LABELS, Sector } from "@/lib/tokens";
import { useStore } from "@/lib/store";
import { BasketCard } from "./BasketCard";

type SortKey = "trending" | "new" | "mcap" | "progress";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "trending", label: "Trending" },
  { key: "new", label: "New" },
  { key: "mcap", label: "Market cap" },
  { key: "progress", label: "Near graduation" },
];

const SECTORS: Array<Sector | "all"> = ["all", "memes", "ai", "defi", "depin", "gaming"];

export function ExploreGrid() {
  const { baskets } = useStore();
  const [sort, setSort] = useState<SortKey>("trending");
  const [sector, setSector] = useState<Sector | "all">("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = baskets.filter((basket) => {
      if (sector !== "all" && basket.sector !== sector) return false;
      if (!needle) return true;
      return (
        basket.name.toLowerCase().includes(needle) ||
        basket.ticker.toLowerCase().includes(needle) ||
        basket.components.some((component) => component.symbol.toLowerCase().includes(needle))
      );
    });

    const sorted = [...filtered];
    switch (sort) {
      case "new":
        sorted.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "mcap":
        sorted.sort((a, b) => marketCapUsd(b) - marketCapUsd(a));
        break;
      case "progress":
        sorted.sort((a, b) => graduationProgress(b.curve) - graduationProgress(a.curve));
        break;
      default:
        sorted.sort((a, b) => changePct(b) - changePct(a));
    }
    return sorted;
  }, [baskets, query, sector, sort]);

  return (
    <section id="explore" className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="headline text-3xl font-semibold text-mist-100">Explore baskets</h2>
          <p className="mt-2 text-sm text-mist-500">
            {visible.length} live {visible.length === 1 ? "basket" : "baskets"} · prices update every
            couple of seconds
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, ticker or sleeve…"
            aria-label="Search baskets"
            className="field w-full py-2.5 md:w-64"
          />
          <div className="hide-scrollbar flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-ink-800/60 p-1">
            {SORTS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSort(option.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  sort === option.key ? "bg-lime-400 text-ink-900" : "text-mist-500 hover:text-mist-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hide-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {SECTORS.map((option) => (
          <button
            key={option}
            onClick={() => setSector(option)}
            className={`chip whitespace-nowrap transition ${
              sector === option
                ? "border-lime-400/50 bg-lime-400/10 text-lime-300"
                : "hover:border-white/25"
            }`}
          >
            {option === "all" ? "All sectors" : SECTOR_LABELS[option]}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((basket) => (
            <BasketCard key={basket.slug} basket={basket} />
          ))}
        </div>
      ) : (
        <div className="panel mt-6 px-6 py-16 text-center">
          <p className="font-display text-lg text-mist-100">Nothing matches that.</p>
          <p className="mt-2 text-sm text-mist-500">
            Try a different sector, or launch the basket yourself.
          </p>
        </div>
      )}
    </section>
  );
}
