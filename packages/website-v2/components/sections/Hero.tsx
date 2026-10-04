import { ArrowDownRight } from "lucide-react";
import { site } from "@/lib/site";
import { CopyButton } from "@/components/fx/CopyButton";
import { Magnetic } from "@/components/fx/Magnetic";
import { Reveal } from "@/components/fx/Reveal";
import { SplitWords } from "@/components/fx/SplitWords";
import { Volley } from "@/components/fx/Volley";
import { StatusBadge } from "./StatusBadge";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-28 sm:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-4">
        <div className="relative z-10">
          <Reveal>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted">
              <span>Vol. I</span>
              <span className="h-px w-8 bg-line" />
              <span>A fee-funded token on Solana</span>
              <StatusBadge />
            </p>
          </Reveal>
          <h1 className="mt-6 font-display text-[clamp(2.9rem,7.4vw,6.4rem)] leading-[0.95] tracking-[-0.02em] text-balance">
            <SplitWords text="Take from the trades." />
            <br />
            <SplitWords text="Give to the holders." accent={["holders"]} delay={0.35} />
          </h1>
          <Reveal delay={0.5}>
            <p className="drop-cap mt-8 max-w-xl text-pretty text-[17px] leading-relaxed text-muted">
              Sherwood claims its own pump.fun creator fees, compounds a share into deeper liquidity, then snapshots every
              holder and sends the rest back out in SOL: <span className="text-fg">every fifteen minutes, on-chain, nothing to claim.</span>
            </p>
          </Reveal>
          <Reveal delay={0.65} className="mt-9 flex flex-wrap items-center gap-3">
            <Magnetic
              href={site.links.buy ?? "#volleys"}
              external={!!site.links.buy}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-bg shadow-[0_0_40px_-8px_rgb(201_162_74/0.6)] transition-shadow hover:shadow-[0_0_60px_-6px_rgb(201_162_74/0.8)]"
            >
              {site.links.buy ? `Buy $${site.ticker} on pump.fun` : "See how it works"}
              <ArrowDownRight className="size-4" />
            </Magnetic>
            <a href="#almanac" className="rounded-full border border-line px-6 py-3 text-sm text-fg/85 transition hover:border-fg/40">
              Live almanac
            </a>
          </Reveal>
          <Reveal delay={0.8} className="mt-8">
            <div className="flex max-w-xl items-center gap-3 border-y border-line py-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted">CA</span>
              {site.ca ? (
                <>
                  <code className="min-w-0 flex-1 truncate font-mono text-sm text-fg/90">{site.ca}</code>
                  <CopyButton text={site.ca} label="Copy contract address" />
                </>
              ) : (
                <span className="font-mono text-sm text-muted">Appears here at launch. Never trust one posted anywhere else first.</span>
              )}
            </div>
          </Reveal>
        </div>
        <Volley className="relative -mx-4 aspect-[640/540] w-[calc(100%+2rem)] sm:mx-0 sm:w-full lg:-mr-10" />
      </div>
    </section>
  );
}
