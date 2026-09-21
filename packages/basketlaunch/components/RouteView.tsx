import { ASSET_BY_SYMBOL, Route } from "@/lib/swap";
import { usd } from "@/lib/format";

/** Renders the hop path the router picked, with each pool's depth. */
export function RouteView({ route }: { route: Route }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {route.path.map((symbol, index) => {
        const asset = ASSET_BY_SYMBOL[symbol];
        const hop = route.hops[index];
        return (
          <span key={`${symbol}-${index}`} className="flex items-center gap-1.5">
            <span
              className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] py-0.5 pl-1 pr-2"
              title={asset?.name}
            >
              <span
                className="grid h-4 w-4 place-items-center rounded-full text-[9px]"
                style={{ backgroundColor: `${asset?.tint ?? "#7E8B9E"}2e`, color: asset?.tint }}
                aria-hidden
              >
                {asset?.glyph ?? "◦"}
              </span>
              <span className="num text-[11px] text-mist-300">{symbol}</span>
            </span>
            {hop ? (
              <span className="num text-[10px] text-mist-700" title={`Pool depth ${usd(hop.poolDepthUsd)}`}>
                →
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
