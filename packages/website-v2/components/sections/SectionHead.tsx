import { Reveal } from "@/components/fx/Reveal";

export function SectionHead({ kicker, title, lede }: { kicker: string; title: React.ReactNode; lede?: string }) {
  return (
    <Reveal className="grid gap-6 border-t border-line pt-6 md:grid-cols-[180px_1fr]">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-accent">{kicker}</p>
      <div>
        <h2 className="max-w-3xl font-display text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] tracking-[-0.015em] text-balance">{title}</h2>
        {lede && <p className="mt-5 max-w-2xl text-pretty text-muted">{lede}</p>}
      </div>
    </Reveal>
  );
}
