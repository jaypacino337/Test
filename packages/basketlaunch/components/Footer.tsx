import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/[0.06] bg-ink-900/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="font-display text-lg font-semibold text-mist-100">
            basket<span className="text-lime-400">launch</span>
          </div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-mist-500">
            Launch a basket of Solana tokens on a bonding curve. One mint, many sleeves,
            fees that flow back into the basket.
          </p>
          <p className="mt-4 text-xs leading-relaxed text-mist-700">
            Beta build. Every price, token and trade on this site is simulated — nothing here
            touches mainnet and nothing here is financial advice.
          </p>
        </div>

        <div>
          <div className="label">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-mist-500">
            <li><Link href="/" className="hover:text-lime-300">Explore baskets</Link></li>
            <li><Link href="/launch" className="hover:text-lime-300">Launch a basket</Link></li>
            <li><Link href="/portfolio" className="hover:text-lime-300">Portfolio</Link></li>
            <li><Link href="/how-it-works" className="hover:text-lime-300">How it works</Link></li>
          </ul>
        </div>

        <div>
          <div className="label">Status</div>
          <ul className="mt-3 space-y-2 text-sm text-mist-500">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-breathe" />
              Simulated feed live
            </li>
            <li>Devnet: not connected</li>
            <li>Mainnet: not connected</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
