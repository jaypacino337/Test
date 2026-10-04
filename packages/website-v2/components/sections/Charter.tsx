import { site } from "@/lib/site";
import { Marquee } from "@/components/fx/Marquee";
import { RevealGroup, RevealItem } from "@/components/fx/Reveal";
import { SectionHead } from "./SectionHead";

export function Ticker() {
  return (
    <div className="-rotate-1 border-y border-line bg-surface/60 py-5 font-display text-2xl italic text-fg/80 sm:text-3xl">
      <Marquee items={site.strip} />
    </div>
  );
}

export function Charter() {
  return (
    <section id="charter" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-28 sm:px-6">
      <SectionHead kicker="The charter" title={<>A fair launch, and <em className="text-gild">no</em> back room.</>} />
      <RevealGroup className="mt-14 md:ml-[180px]">
        <dl className="divide-y divide-line border-y border-line">
          {site.charter.map((c) => (
            <RevealItem key={c.k} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr]">
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">{c.k}</dt>
              <dd className="font-display text-xl text-pretty">{c.v}</dd>
            </RevealItem>
          ))}
        </dl>
      </RevealGroup>
    </section>
  );
}
