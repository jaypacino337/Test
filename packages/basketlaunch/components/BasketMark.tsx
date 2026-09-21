import { Basket } from "@/lib/baskets";
import { TOKEN_BY_SYMBOL } from "@/lib/tokens";

/**
 * A basket's identity mark: a conic wheel of its component weights.
 * Every basket gets a distinct sigil for free, no artwork required.
 */
export function BasketMark({ basket, size = 44 }: { basket: Basket; size?: number }) {
  let cursor = 0;
  const stops = basket.components.map((component) => {
    const tint = TOKEN_BY_SYMBOL[component.symbol]?.tint ?? "#7E8B9E";
    const from = cursor;
    cursor += component.weight;
    return `${tint} ${from}% ${cursor}%`;
  });

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(${stops.join(", ")})` }}
      aria-hidden
    >
      <span
        className="grid place-items-center rounded-full bg-ink-900 font-display font-semibold text-mist-100"
        style={{ width: size - 12, height: size - 12, fontSize: size * 0.3 }}
      >
        {basket.ticker.slice(0, 2)}
      </span>
    </span>
  );
}
