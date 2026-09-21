/**
 * Swap engine: a small constant-product AMM over a fixed pool graph.
 *
 * Each pool is described by its USD depth rather than raw reserves, so the
 * simulated reserves track live prices instead of drifting away from them.
 * The router compares every direct pool and every two-hop path and returns
 * whichever actually pays out most — same shape as a real aggregator quote.
 */
import { SOL_USD } from "./baskets";
import { Sector, TOKENS, Token } from "./tokens";

export interface SwapAsset {
  symbol: string;
  name: string;
  sector: Sector | "native";
  glyph: string;
  tint: string;
}

export const NATIVE: SwapAsset = {
  symbol: "SOL",
  name: "Solana",
  sector: "native",
  glyph: "◎",
  tint: "#8E7BFF",
};

export const SWAP_ASSETS: SwapAsset[] = [
  NATIVE,
  ...TOKENS.map((token: Token) => ({
    symbol: token.symbol,
    name: token.name,
    sector: token.sector,
    glyph: token.glyph,
    tint: token.tint,
  })),
];

export const ASSET_BY_SYMBOL: Record<string, SwapAsset> = Object.fromEntries(
  SWAP_ASSETS.map((asset) => [asset.symbol, asset]),
);

export interface Pool {
  a: string;
  b: string;
  /** Total pool size in USD; half sits on each side. */
  depthUsd: number;
  feeBps: number;
}

/**
 * SOL is the hub every asset pairs against; USDX carries the stable routes,
 * and a few organic meme pairs exist directly. Anything else needs two hops.
 */
export const POOLS: Pool[] = [
  { a: "SOL", b: "SOLR", depthUsd: 4_200_000, feeBps: 20 },
  { a: "SOL", b: "USDX", depthUsd: 6_800_000, feeBps: 20 },
  { a: "SOL", b: "TNSR", depthUsd: 1_900_000, feeBps: 25 },
  { a: "SOL", b: "NURO", depthUsd: 1_150_000, feeBps: 25 },
  { a: "SOL", b: "ORBT", depthUsd: 880_000, feeBps: 25 },
  { a: "SOL", b: "MESH", depthUsd: 620_000, feeBps: 25 },
  { a: "SOL", b: "VLTS", depthUsd: 740_000, feeBps: 25 },
  { a: "SOL", b: "PERP", depthUsd: 510_000, feeBps: 30 },
  { a: "SOL", b: "KITN", depthUsd: 430_000, feeBps: 30 },
  { a: "SOL", b: "PLNK", depthUsd: 310_000, feeBps: 30 },
  { a: "SOL", b: "GRIN", depthUsd: 195_000, feeBps: 30 },
  { a: "SOL", b: "HODL", depthUsd: 240_000, feeBps: 30 },
  { a: "SOL", b: "QUST", depthUsd: 280_000, feeBps: 30 },
  { a: "SOL", b: "ARCD", depthUsd: 160_000, feeBps: 30 },
  { a: "USDX", b: "SOLR", depthUsd: 2_400_000, feeBps: 20 },
  { a: "USDX", b: "TNSR", depthUsd: 690_000, feeBps: 25 },
  { a: "USDX", b: "VLTS", depthUsd: 420_000, feeBps: 25 },
  { a: "USDX", b: "MESH", depthUsd: 265_000, feeBps: 25 },
  { a: "KITN", b: "GRIN", depthUsd: 120_000, feeBps: 30 },
  { a: "PLNK", b: "HODL", depthUsd: 95_000, feeBps: 30 },
  { a: "QUST", b: "ARCD", depthUsd: 110_000, feeBps: 30 },
];

export function assetPrice(symbol: string, prices: Record<string, number>): number {
  if (symbol === "SOL") return SOL_USD;
  return prices[symbol] ?? 0;
}

function poolFor(a: string, b: string): Pool | undefined {
  return POOLS.find(
    (pool) => (pool.a === a && pool.b === b) || (pool.a === b && pool.b === a),
  );
}

export interface HopQuote {
  from: string;
  to: string;
  amountIn: number;
  amountOut: number;
  feeUsd: number;
  poolDepthUsd: number;
}

/** Single-pool swap. Returns null when the pair has no direct pool. */
function quoteHop(
  from: string,
  to: string,
  amountIn: number,
  prices: Record<string, number>,
  applyFee = true,
): HopQuote | null {
  const pool = poolFor(from, to);
  if (!pool || amountIn <= 0) return null;

  const priceIn = assetPrice(from, prices);
  const priceOut = assetPrice(to, prices);
  if (priceIn <= 0 || priceOut <= 0) return null;

  const reserveIn = pool.depthUsd / 2 / priceIn;
  const reserveOut = pool.depthUsd / 2 / priceOut;
  const fee = applyFee ? (amountIn * pool.feeBps) / 10_000 : 0;
  const netIn = amountIn - fee;
  const amountOut = (reserveOut * netIn) / (reserveIn + netIn);

  return {
    from,
    to,
    amountIn,
    amountOut,
    feeUsd: fee * priceIn,
    poolDepthUsd: pool.depthUsd,
  };
}

export interface Route {
  path: string[];
  hops: HopQuote[];
  amountOut: number;
  feeUsd: number;
}

function quotePath(
  path: string[],
  amountIn: number,
  prices: Record<string, number>,
  applyFee = true,
): Route | null {
  const hops: HopQuote[] = [];
  let amount = amountIn;
  for (let i = 0; i < path.length - 1; i += 1) {
    const hop = quoteHop(path[i], path[i + 1], amount, prices, applyFee);
    if (!hop) return null;
    hops.push(hop);
    amount = hop.amountOut;
  }
  if (!hops.length) return null;
  return {
    path,
    hops,
    amountOut: amount,
    feeUsd: hops.reduce((sum, hop) => sum + hop.feeUsd, 0),
  };
}

/** Intermediate assets the router is allowed to hop through. */
const HUBS = ["SOL", "USDX", "SOLR"];

function candidatePaths(from: string, to: string): string[][] {
  const paths: string[][] = [[from, to]];
  for (const hub of HUBS) {
    if (hub !== from && hub !== to) paths.push([from, hub, to]);
  }
  return paths;
}

export interface SwapQuote {
  route: Route;
  amountIn: number;
  amountOut: number;
  /** Output at mid price, ignoring fees and depth. */
  amountOutAtMid: number;
  priceImpact: number;
  feeUsd: number;
  rate: number;
  minReceived: number;
  valueInUsd: number;
  valueOutUsd: number;
}

export function quoteSwap(
  from: string,
  to: string,
  amountIn: number,
  prices: Record<string, number>,
  slippageBps: number,
): SwapQuote | null {
  if (from === to || !(amountIn > 0)) return null;

  let best: Route | null = null;
  for (const path of candidatePaths(from, to)) {
    const route = quotePath(path, amountIn, prices, true);
    if (route && (!best || route.amountOut > best.amountOut)) best = route;
  }
  if (!best) return null;

  const priceIn = assetPrice(from, prices);
  const priceOut = assetPrice(to, prices);
  const amountOutAtMid = priceOut > 0 ? (amountIn * priceIn) / priceOut : 0;

  // Impact is measured against the same route with fees switched off, so the
  // LP fee is not double-counted in the number shown to the user.
  const noFee = quotePath(best.path, amountIn, prices, false);
  const impactBase = noFee?.amountOut ?? best.amountOut;
  const priceImpact = amountOutAtMid > 0 ? Math.max(0, (amountOutAtMid - impactBase) / amountOutAtMid) : 0;

  return {
    route: best,
    amountIn,
    amountOut: best.amountOut,
    amountOutAtMid,
    priceImpact,
    feeUsd: best.feeUsd,
    rate: amountIn > 0 ? best.amountOut / amountIn : 0,
    minReceived: best.amountOut * (1 - slippageBps / 10_000),
    valueInUsd: amountIn * priceIn,
    valueOutUsd: best.amountOut * priceOut,
  };
}
