import { site } from "@/lib/site";
import { FlightLine } from "@/components/fx/FlightLine";
import { Reveal } from "@/components/fx/Reveal";
import { SectionHead } from "./SectionHead";

export function Volleys() {
  return (
    <section id="volleys" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-28 sm:px-6">
      <SectionHead kicker="The loop" title={<>Four steps, on a loop, <em className="text-gild">forever</em>.</>} lede="Nothing to stake, claim or connect. The loop runs on a server, and every step leaves a public transaction." />
      <div className="relative mt-16 grid gap-0 md:grid-cols-[180px_1fr]">
        <FlightLine className="hidden md:block" />
        <ol className="divide-y divide-line border-y border-line">
          {site.volleys.map((v) => (
            <li key={v.n}>
              <Reveal className="grid gap-4 py-10 sm:grid-cols-[110px_1fr_1.2fr] sm:items-baseline sm:gap-8">
                <span className="font-display text-5xl italic text-accent/80">{v.n}</span>
                <h3 className="font-display text-3xl tracking-tight">{v.title}</h3>
                <p className="max-w-xl text-pretty leading-relaxed text-muted">{v.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
