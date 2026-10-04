"use client";

import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { Mark } from "./Mark";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled || open ? "border-b border-line bg-bg/80 backdrop-blur-md" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
          <Mark className="size-7 text-accent" />
          <span className="font-display text-xl tracking-tight">{site.name}</span>
          <span className="hidden font-mono text-[11px] tracking-widest text-muted sm:inline">${site.ticker}</span>
        </a>
        <ul className="hidden items-center gap-8 text-sm text-muted md:flex">
          {site.nav.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="transition hover:text-fg">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a
            href={site.links.buy ?? "#almanac"}
            {...(site.links.buy ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="rounded-full border border-accent/60 px-4 py-2 text-sm text-accent transition hover:bg-accent hover:text-bg"
          >
            {site.links.buy ? `Buy $${site.ticker}` : "Launching soon"}
          </a>
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid size-9 place-items-center rounded-full border border-line md:hidden">
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden px-4 md:hidden"
          >
            {site.nav.map((l) => (
              <li key={l.href} className="border-t border-line">
                <a href={l.href} onClick={() => setOpen(false)} className="block py-3 font-display text-lg">
                  {l.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}
