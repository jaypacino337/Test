"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { shortAddress, sol } from "@/lib/format";

const NAV = [
  { href: "/", label: "Explore" },
  { href: "/swap", label: "Swap" },
  { href: "/launch", label: "Launch" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/how-it-works", label: "How it works" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { wallet, connect, disconnect } = useStore();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-ink-900/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime-400 font-display text-base font-bold text-ink-900">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-mist-100">
            basket<span className="text-lime-400">launch</span>
          </span>
          <span className="chip hidden px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] sm:inline-flex">
            beta
          </span>
        </Link>

        <nav className="hide-scrollbar ml-auto hidden items-center gap-1 overflow-x-auto md:flex">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-lime-400/10 text-lime-200 ring-1 ring-inset ring-lime-400/25"
                    : "text-mist-500 hover:bg-white/[0.04] hover:text-mist-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {wallet.connected ? (
            <>
              <span className="chip hidden sm:inline-flex">
                <span className="num text-lime-400">{sol(wallet.solBalance)}</span>
              </span>
              <button onClick={disconnect} className="btn-ghost px-4 py-2">
                <span className="num">{shortAddress(wallet.address)}</span>
              </button>
            </>
          ) : (
            <button onClick={connect} className="btn-primary px-4 py-2">
              Connect wallet
            </button>
          )}
        </div>
      </div>

      <nav className="hide-scrollbar flex items-center gap-1 overflow-x-auto border-t border-white/[0.06] px-4 py-2 md:hidden">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-lime-400/10 text-lime-200 ring-1 ring-inset ring-lime-400/25"
                  : "text-mist-500"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
