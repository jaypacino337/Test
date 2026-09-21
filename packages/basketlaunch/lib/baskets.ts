import { CurveState, marketCapSol, spotPrice } from "./curve";
import { hashSeed, mulberry32, randomWalk } from "./rng";
import { fakeAddress, Sector, TOKEN_BY_SYMBOL } from "./tokens";

export interface Component {
  symbol: string;
  /** Percentage weight, 0-100. Weights across a basket sum to 100. */
  weight: number;
}

export interface Basket {
  slug: string;
  name: string;
  ticker: string;
  tagline: string;
  sector: Sector;
  components: Component[];
  curve: CurveState;
  creator: string;
  mint: string;
  createdAt: number;
  holders: number;
  /** Fees accrued to the rebalance vault, in SOL. */
  vault: number;
  /** True for baskets minted by the visitor during this session. */
  local?: boolean;
}

export interface Trade {
  id: string;
  basket: string;
  side: "buy" | "sell";
  sol: number;
  tokens: number;
  trader: string;
  at: number;
}

/** USD value of one SOL — fixed in the demo so numbers stay legible. */
export const SOL_USD = 148.2;

const SEEDS: Array<Omit<Basket, "creator" | "mint" | "createdAt" | "holders" | "vault">> = [
  {
    slug: "degen-index",
    name: "Degen Index",
    ticker: "DGNX",
    tagline: "The four loudest tickers on the timeline, equal weight, no mercy.",
    sector: "memes",
    components: [
      { symbol: "KITN", weight: 30 },
      { symbol: "PLNK", weight: 25 },
      { symbol: "GRIN", weight: 25 },
      { symbol: "HODL", weight: 20 },
    ],
    curve: { realSol: 61.4, tokensSold: 583_000_000 },
  },
  {
    slug: "machine-money",
    name: "Machine Money",
    ticker: "MCHN",
    tagline: "Compute, inference and the picks-and-shovels of on-chain AI.",
    sector: "ai",
    components: [
      { symbol: "TNSR", weight: 45 },
      { symbol: "NURO", weight: 35 },
      { symbol: "ORBT", weight: 20 },
    ],
    curve: { realSol: 78.9, tokensSold: 702_000_000 },
  },
  {
    slug: "hardware-yield",
    name: "Hardware Yield",
    ticker: "DPIN",
    tagline: "DePIN networks with real hardware and real revenue. Mostly.",
    sector: "depin",
    components: [
      { symbol: "MESH", weight: 40 },
      { symbol: "ORBT", weight: 40 },
      { symbol: "VLTS", weight: 20 },
    ],
    curve: { realSol: 34.2, tokensSold: 402_000_000 },
  },
  {
    slug: "blue-chip-defi",
    name: "Blue Chip DeFi",
    ticker: "BCDF",
    tagline: "Boring on purpose: fee-generating protocols and a stables sleeve.",
    sector: "defi",
    components: [
      { symbol: "SOLR", weight: 35 },
      { symbol: "VLTS", weight: 25 },
      { symbol: "PERP", weight: 25 },
      { symbol: "USDX", weight: 15 },
    ],
    curve: { realSol: 85.6, tokensSold: 784_000_000 },
  },
  {
    slug: "arcade-cabinet",
    name: "Arcade Cabinet",
    ticker: "ARCA",
    tagline: "On-chain games that actually shipped a client.",
    sector: "gaming",
    components: [
      { symbol: "QUST", weight: 50 },
      { symbol: "ARCD", weight: 35 },
      { symbol: "SOLR", weight: 15 },
    ],
    curve: { realSol: 12.8, tokensSold: 213_000_000 },
  },
  {
    slug: "cat-basket",
    name: "Cat Basket",
    ticker: "MEOW",
    tagline: "One sector, one thesis, nine lives.",
    sector: "memes",
    components: [
      { symbol: "KITN", weight: 60 },
      { symbol: "GRIN", weight: 25 },
      { symbol: "HODL", weight: 15 },
    ],
    curve: { realSol: 5.1, tokensSold: 108_000_000 },
  },
  {
    slug: "barbell",
    name: "The Barbell",
    ticker: "BRBL",
    tagline: "Half stables, half pure chaos. Sleep is optional.",
    sector: "defi",
    components: [
      { symbol: "USDX", weight: 50 },
      { symbol: "KITN", weight: 25 },
      { symbol: "ARCD", weight: 25 },
    ],
    curve: { realSol: 41.7, tokensSold: 455_000_000 },
  },
  {
    slug: "long-tail",
    name: "Long Tail",
    ticker: "TAIL",
    tagline: "Eight small caps, evenly weighted, rebalanced every epoch.",
    sector: "memes",
    components: [
      { symbol: "PLNK", weight: 20 },
      { symbol: "ARCD", weight: 20 },
      { symbol: "QUST", weight: 20 },
      { symbol: "MESH", weight: 20 },
      { symbol: "GRIN", weight: 20 },
    ],
    curve: { realSol: 23.9, tokensSold: 331_000_000 },
  },
];

const DAY = 86_400_000;

/**
 * Build the demo baskets. `now` is passed in so the server render and the first
 * client render agree on every timestamp.
 */
export function seedBaskets(now: number): Basket[] {
  return SEEDS.map((seed, index) => {
    const rand = mulberry32(hashSeed(seed.slug));
    return {
      ...seed,
      creator: fakeAddress(`${seed.slug}-creator`),
      mint: fakeAddress(`${seed.slug}-mint`),
      createdAt: now - Math.floor(rand() * 9 * DAY) - index * 3_600_000,
      holders: 40 + Math.floor(rand() * 1800),
      vault: seed.curve.realSol * 0.004 * (0.6 + rand()),
    };
  });
}

/** Net asset value of one basket unit, in USD, from live component prices. */
export function navUsd(basket: Basket, prices: Record<string, number>): number {
  return basket.components.reduce((total, component) => {
    const spot = prices[component.symbol] ?? TOKEN_BY_SYMBOL[component.symbol]?.spot ?? 0;
    const base = TOKEN_BY_SYMBOL[component.symbol]?.spot ?? spot ?? 1;
    // Weighted index: each sleeve contributes weight% of a $1 basket unit,
    // scaled by how far its component has moved from its reference price.
    return total + (component.weight / 100) * (base > 0 ? spot / base : 1);
  }, 0);
}

export function marketCapUsd(basket: Basket): number {
  return marketCapSol(basket.curve) * SOL_USD;
}

export function priceUsd(basket: Basket): number {
  return spotPrice(basket.curve) * SOL_USD;
}

/** 24h change, derived from the basket's own history walk. */
export function changePct(basket: Basket): number {
  const series = priceHistory(basket, 48);
  const first = series[0];
  const last = series[series.length - 1];
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

/** Price history ending at the basket's current curve price. */
export function priceHistory(basket: Basket, points = 64): number[] {
  const current = priceUsd(basket);
  const walk = randomWalk(basket.slug, points, current, 0.16);
  const drift = current / walk[walk.length - 1];
  return walk.map((value) => value * drift);
}

export function seedTrades(baskets: Basket[], now: number, count = 22): Trade[] {
  const rand = mulberry32(hashSeed("trade-feed"));
  const trades: Trade[] = [];
  for (let i = 0; i < count; i += 1) {
    const basket = baskets[Math.floor(rand() * baskets.length)];
    const side = rand() > 0.42 ? "buy" : "sell";
    const solAmount = Number((0.15 + rand() * 6).toFixed(2));
    trades.push({
      id: `seed-${i}`,
      basket: basket.slug,
      side,
      sol: solAmount,
      tokens: solAmount / Math.max(spotPrice(basket.curve), 1e-9),
      trader: fakeAddress(`trader-${i}`),
      at: now - i * (30_000 + Math.floor(rand() * 90_000)),
    });
  }
  return trades.sort((a, b) => b.at - a.at);
}
