import { site } from "@/lib/site";
import { Magnetic } from "@/components/fx/Magnetic";
import { Reveal } from "@/components/fx/Reveal";
import { Mark } from "./Mark";

export function Cta() {
  return (
    <section className="relative overflow-hidden border-t border-line">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_300px_at_50%_100%,rgb(201_162_74/0.14),transparent_70%)]" />
      <Reveal className="relative mx-auto max-w-4xl px-4 py-32 text-center sm:px-6">
        <Mark className="mx-auto size-12 text-accent" />
        <h2 className="mt-8 font-display text-[clamp(2.4rem,6vw,4.8rem)] leading-[1] tracking-[-0.02em] text-balance">
          Hold the line. <em className="text-gild">The arrows come to you.</em>
        </h2>
        <div className="mt-10 flex justify-center">
          <Magnetic
            href={site.links.buy ?? "#top"}
            external={!!site.links.buy}
            className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-bg shadow-[0_0_50px_-10px_rgb(201_162_74/0.7)]"
          >
            {site.links.buy ? `Buy $${site.ticker}` : "Launching soon: back to top"}
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  const links = [
    { label: "pump.fun", href: site.links.buy },
    { label: "Chart", href: site.links.chart },
    { label: "Token on Solscan", href: site.links.explorer },
    { label: "Source code", href: site.links.source },
    { label: "X", href: site.links.x },
    { label: "Telegram", href: site.links.telegram },
  ].filter((l): l is { label: string; href: string } => !!l.href);
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_1fr_1.4fr]">
        <div>
          <p className="flex items-center gap-2 font-display text-2xl">
            <Mark className="size-6 text-accent" /> {site.name}
          </p>
          <p className="mt-3 max-w-xs text-sm text-muted">{site.tagline}</p>
        </div>
        <ul className="space-y-2 text-sm">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-muted transition hover:text-fg">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs leading-relaxed text-muted/80">{site.disclaimer}</p>
      </div>
      <p className="mx-auto max-w-7xl border-t border-line px-4 py-6 font-mono text-[11px] text-muted/70 sm:px-6">
        © {new Date().getFullYear()} Sherwood. Not affiliated with Robinhood Markets, Inc. or pump.fun.
      </p>
    </footer>
  );
}
