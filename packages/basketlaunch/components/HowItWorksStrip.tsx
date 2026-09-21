const STEPS = [
  {
    step: "01",
    title: "Compose",
    body: "Choose up to eight sleeves from the token universe and set weights that add to 100%.",
  },
  {
    step: "02",
    title: "Deploy",
    body: "One transaction mints the basket token and opens its bonding curve at a fixed start price.",
  },
  {
    step: "03",
    title: "Trade",
    body: "Buys walk the curve up, sells walk it down. 1% of every trade is skimmed as fees.",
  },
  {
    step: "04",
    title: "Graduate",
    body: "At 85 SOL raised, the curve closes and liquidity migrates to an AMM pool.",
  },
];

export function HowItWorksStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item) => (
          <div key={item.step} className="panel panel-hover p-5">
            <span className="num text-xs text-lime-400">{item.step}</span>
            <h3 className="mt-2 font-display text-lg font-semibold text-mist-100">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist-500">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
