"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SWAP_ASSETS, SwapAsset, assetPrice } from "@/lib/swap";
import { price, quantity, usd } from "@/lib/format";
import { useStore } from "@/lib/store";

/** The asset picker: a button that opens a searchable, balance-sorted list. */
export function TokenSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const asset = SWAP_ASSETS.find((entry) => entry.symbol === value);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] py-1.5 pl-1.5 pr-3 transition hover:border-lime-400/40"
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-sm"
          style={{ backgroundColor: `${asset?.tint ?? "#7E8B9E"}24`, color: asset?.tint }}
          aria-hidden
        >
          {asset?.glyph ?? "◦"}
        </span>
        <span className="num text-sm font-semibold text-mist-100">{value}</span>
        <span className="text-[10px] text-mist-500" aria-hidden>
          ▼
        </span>
      </button>

      {open ? (
        <AssetDialog
          selected={value}
          onClose={() => setOpen(false)}
          onPick={(symbol) => {
            onChange(symbol);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function AssetDialog({
  selected,
  onClose,
  onPick,
}: {
  selected: string;
  onClose: () => void;
  onPick: (symbol: string) => void;
}) {
  const { prices, balanceOf } = useStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SWAP_ASSETS.filter(
        (asset) =>
          !needle ||
          asset.symbol.toLowerCase().includes(needle) ||
          asset.name.toLowerCase().includes(needle),
      )
      .map((asset) => {
        const balance = balanceOf(asset.symbol);
        return { asset, balance, valueUsd: balance * assetPrice(asset.symbol, prices) };
      })
      .sort((a, b) => b.valueUsd - a.valueUsd);
  }, [query, prices, balanceOf]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="panel max-h-[80vh] w-full max-w-md overflow-hidden bg-ink-800/95 shadow-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Select a token"
      >
        <div className="border-b border-white/[0.07] p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-mist-100">Select a token</h2>
            <button onClick={onClose} className="text-mist-500 hover:text-mist-100" aria-label="Close">
              ✕
            </button>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or symbol"
            className="field mt-3 py-2.5"
            aria-label="Search tokens"
          />
        </div>

        <ul className="hide-scrollbar max-h-[54vh] overflow-y-auto p-2">
          {rows.map(({ asset, balance, valueUsd }) => (
            <li key={asset.symbol}>
              <button
                onClick={() => onPick(asset.symbol)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.05] ${
                  asset.symbol === selected ? "bg-white/[0.04] ring-1 ring-lime-400/30" : ""
                }`}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base"
                  style={{ backgroundColor: `${asset.tint}24`, color: asset.tint }}
                  aria-hidden
                >
                  {asset.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-mist-100">{asset.symbol}</span>
                  <span className="block truncate text-xs text-mist-500">{asset.name}</span>
                </span>
                <span className="text-right">
                  <span className="num block text-sm text-mist-100">
                    {balance > 0 ? quantity(balance) : "—"}
                  </span>
                  <span className="num block text-[11px] text-mist-700">
                    {balance > 0 ? usd(valueUsd) : price(assetPrice(asset.symbol, prices))}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!rows.length ? (
            <li className="px-4 py-10 text-center text-sm text-mist-500">No token matches that.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
