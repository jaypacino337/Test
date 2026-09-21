import Link from "next/link";
import {
  FEE_BPS,
  GRADUATION_SOL,
  TOTAL_SUPPLY,
  VAULT_FEE_SHARE,
  VIRTUAL_SOL,
  VIRTUAL_TOKENS,
} from "@/lib/curve";
import { compact } from "@/lib/format";

const FAQ = [
  {
    q: "What exactly is a basket?",
    a: "One SPL token whose thesis is a weighted set of other tokens. Instead of picking a single ticker, a creator publishes the weights and everyone trades that one mint.",
  },
  {
    q: "How is the price set?",
    a: `Every basket opens on a constant-product bonding curve seeded with ${VIRTUAL_SOL} virtual SOL against ${compact(VIRTUAL_TOKENS)} virtual tokens. Buys move the price up the curve, sells move it back down — no order book, no market maker.`,
  },
  {
    q: "What happens at graduation?",
    a: `Once ${GRADUATION_SOL} SOL has been raised, the curve closes. In production the remaining reserve seeds an AMM pool and the LP position is burned, so liquidity stays put.`,
  },
  {
    q: "Where do fees go?",
    a: `${FEE_BPS / 100}% is taken on each side of a trade. ${Math.round(VAULT_FEE_SHARE * 100)}% of that goes to the basket's rebalance vault, which buys the underlying sleeves back toward their target weights; the rest covers the creator and liquidity.`,
  },
  {
    q: "Is any of this real?",
    a: "No. This is a beta build running on a simulated market: invented tokens, invented prices, a fake wallet and a state that lives in your browser. Nothing is broadcast to any network.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header>
        <span className="chip">Mechanics</span>
        <h1 className="headline mt-5 text-4xl font-semibold text-mist-100 sm:text-5xl">
          How a basket actually works.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist-300 sm:text-base">
          The whole thing is four moving parts: a fixed supply, a bonding curve, a fee split, and a
          graduation threshold. Here they are with the real numbers this beta runs on.
        </p>
      </header>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Param label="Total supply" value={compact(TOTAL_SUPPLY)} />
        <Param label="Graduation" value={`${GRADUATION_SOL} SOL`} />
        <Param label="Trade fee" value={`${FEE_BPS / 100}%`} />
      </div>

      <div className="panel mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-mist-100">The curve</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist-500">
          Reserves start virtual, so the first buyer is not trading against an empty pool. Price is
          simply one reserve over the other:
        </p>
        <pre className="num mt-4 overflow-x-auto rounded-xl border border-white/[0.07] bg-ink-900/70 p-4 text-xs leading-relaxed text-mist-300">
{`solReserve   = ${VIRTUAL_SOL} + realSolRaised
tokenReserve = ${compact(VIRTUAL_TOKENS)} - tokensSold
price        = solReserve / tokenReserve
k            = solReserve * tokenReserve   // held constant per trade`}
        </pre>
        <p className="mt-4 text-sm leading-relaxed text-mist-500">
          A buy of <span className="num text-mist-300">x</span> SOL takes the fee first, then hands
          back <span className="num text-mist-300">tokenReserve - k / (solReserve + x)</span> tokens.
          Selling runs the same maths in reverse.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="panel group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-mist-100">
              {item.q}
              <span className="text-mist-500 transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-mist-500">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="panel mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-display text-lg font-semibold text-mist-100">Ready to try it?</h2>
          <p className="mt-1 text-sm text-mist-500">Compose a basket in under a minute.</p>
        </div>
        <Link href="/launch" className="btn-primary px-6 py-3">
          Launch a basket
        </Link>
      </div>
    </div>
  );
}

function Param({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-4 py-3.5">
      <div className="label">{label}</div>
      <div className="num mt-1.5 text-xl text-lime-400">{value}</div>
    </div>
  );
}
