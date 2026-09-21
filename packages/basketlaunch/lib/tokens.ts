import { hashSeed, mulberry32 } from "./rng";

export type Sector = "memes" | "defi" | "depin" | "ai" | "gaming" | "stables";

export interface Token {
  symbol: string;
  name: string;
  sector: Sector;
  /** Simulated spot price in USD. */
  spot: number;
  /** Annualised-ish volatility knob driving the walk. */
  vol: number;
  glyph: string;
  tint: string;
}

/**
 * The demo token universe. Everything here is invented — BasketLaunch beta runs
 * entirely on simulated market data, no mainnet reads.
 */
export const TOKENS: Token[] = [
  { symbol: "SOLR", name: "Solaris", sector: "defi", spot: 148.2, vol: 0.05, glyph: "◎", tint: "#C2F24E" },
  { symbol: "KITN", name: "Kitten Cartel", sector: "memes", spot: 0.00042, vol: 0.16, glyph: "⌘", tint: "#FF6B85" },
  { symbol: "PLNK", name: "Plankton", sector: "memes", spot: 0.0119, vol: 0.14, glyph: "≋", tint: "#4FE3CF" },
  { symbol: "ORBT", name: "Orbital", sector: "depin", spot: 2.84, vol: 0.08, glyph: "⬡", tint: "#8E7BFF" },
  { symbol: "MESH", name: "Meshnet", sector: "depin", spot: 0.732, vol: 0.09, glyph: "⧉", tint: "#4FE3CF" },
  { symbol: "NURO", name: "Neuro Labs", sector: "ai", spot: 5.41, vol: 0.11, glyph: "◈", tint: "#8E7BFF" },
  { symbol: "TNSR", name: "Tensora", sector: "ai", spot: 12.07, vol: 0.1, glyph: "⟠", tint: "#C2F24E" },
  { symbol: "VLTS", name: "Vaults Fi", sector: "defi", spot: 3.96, vol: 0.07, glyph: "▣", tint: "#FFC24D" },
  { symbol: "PERP", name: "Perpetua", sector: "defi", spot: 0.884, vol: 0.09, glyph: "∞", tint: "#FF6B85" },
  { symbol: "QUST", name: "Questline", sector: "gaming", spot: 0.216, vol: 0.13, glyph: "✦", tint: "#FFC24D" },
  { symbol: "ARCD", name: "Arcadia", sector: "gaming", spot: 0.0491, vol: 0.15, glyph: "◱", tint: "#8E7BFF" },
  { symbol: "GRIN", name: "Grinnie", sector: "memes", spot: 0.00711, vol: 0.19, glyph: "☺", tint: "#C2F24E" },
  { symbol: "HODL", name: "Hodlr", sector: "memes", spot: 0.0333, vol: 0.17, glyph: "⬢", tint: "#4FE3CF" },
  { symbol: "USDX", name: "Unit Dollar", sector: "stables", spot: 1.0, vol: 0.002, glyph: "＄", tint: "#B6C2D2" },
];

export const TOKEN_BY_SYMBOL: Record<string, Token> = Object.fromEntries(
  TOKENS.map((token) => [token.symbol, token]),
);

export const SECTOR_LABELS: Record<Sector, string> = {
  memes: "Memes",
  defi: "DeFi",
  depin: "DePIN",
  ai: "AI",
  gaming: "Gaming",
  stables: "Stables",
};

/** Deterministic fake pubkey so the UI has something to truncate. */
export function fakeAddress(seed: string): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const rand = mulberry32(hashSeed(seed));
  let out = "";
  for (let i = 0; i < 44; i += 1) out += alphabet[Math.floor(rand() * alphabet.length)];
  return out;
}
