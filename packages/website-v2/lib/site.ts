/**
 * Every word and link on the page lives here, so sections never hardcode copy.
 * Live numbers come from lib/stats.ts (Supabase / bot API / DexScreener), never from this file.
 */
const ca = (process.env.NEXT_PUBLIC_MINT_ADDRESS ?? "").trim();

export const site = {
  name: "Sherwood",
  ticker: "ARROW",
  tagline: "Take from the trades. Give to the holders.",
  description:
    "Sherwood ($ARROW) claims its own pump.fun creator fees, compounds a share into liquidity and airdrops the rest to every holder, every 15 minutes, with no claiming.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** empty until launch: the page says so instead of showing a fake address */
  ca,
  links: {
    buy: ca ? `https://pump.fun/coin/${ca}` : null,
    chart: ca ? `https://dexscreener.com/solana/${ca}` : null,
    explorer: ca ? `https://solscan.io/token/${ca}` : null,
    source: "https://github.com/jaypacino337/test",
    x: null as string | null, // TODO(Jay): handle
    telegram: null as string | null, // TODO(Jay): invite link
  },
  nav: [
    { href: "#almanac", label: "Almanac" },
    { href: "#volleys", label: "The loop" },
    { href: "#route", label: "Fee route" },
    { href: "#ledger", label: "Ledger" },
    { href: "#faq", label: "FAQ" },
  ],
  strip: [
    "Take from the trades",
    "Give to the holders",
    "Every fifteen minutes",
    "No claiming",
    "Fees in, SOL out",
    "Every payout on-chain",
  ],
  volleys: [
    {
      n: "I",
      title: "The trade",
      body: "$ARROW trades on pump.fun like any coin. Every buy and sell pays pump.fun a fee, and a share of it accrues to the coin's creator vault.",
    },
    {
      n: "II",
      title: "The take",
      body: "Each cycle the bot claims that creator share. It signs locally and counts only the SOL that actually landed.",
    },
    {
      n: "III",
      title: "The split",
      body: "The harvest is split on a fixed route: one part deepens the ARROW/SOL pool, the rest fills the holders' purse.",
    },
    {
      n: "IV",
      title: "The give",
      body: "Every holder is snapshotted and paid pro-rata in SOL, straight to their wallet. Every batch is recorded before it is broadcast, so a crash or retry never pays anyone twice.",
    },
  ],
  charter: [
    { k: "Supply", v: "1,000,000,000 $ARROW, all through the public bonding curve" },
    { k: "Team allocation", v: "None. No presale, no vesting." },
    { k: "Fee source", v: "pump.fun creator-fee share. No transfer tax." },
    { k: "Eligibility", v: "Any wallet holding $ARROW at snapshot. Pools and program accounts are excluded." },
    { k: "Cadence", v: "Every 15 minutes" },
  ],
  faq: [
    {
      q: "Is this affiliated with Robinhood Markets, Inc.?",
      a: "No. Sherwood is not affiliated with, endorsed by or connected to Robinhood Markets, Inc. The name comes from the public-domain folk tale (take from the trades, give to the holders), not the brokerage.",
    },
    {
      q: "Where do the rewards come from?",
      a: "From pump.fun's creator-fee program, which pays the coin's creator wallet a share of trading fees. Sherwood's bot claims that share automatically and routes it to liquidity and holders instead of a person keeping it.",
    },
    {
      q: "Do I need to claim anything?",
      a: "No. If you hold $ARROW at snapshot time and your share is worth sending, SOL arrives in your wallet. There's nothing to click and no site to connect.",
    },
    {
      q: "How is my share calculated?",
      a: "Your balance divided by the total eligible balance at the snapshot, times the SOL in the rewards purse. It's rounded down, so the total paid never exceeds the purse. Pools, the bonding curve and the protocol's own wallets don't count.",
    },
    {
      q: "Why does the almanac show “—”?",
      a: "Because the page only shows real numbers. Until the bot has reported (or the coin has a market), a figure stays a dash instead of a placeholder.",
    },
    {
      q: "Is this financial advice or a guaranteed return?",
      a: "No. $ARROW is a highly speculative token. Fee volume, and so rewards, can be zero in any cycle. Nothing here is investment advice.",
    },
  ],
  disclaimer:
    "$ARROW is an experimental, highly volatile digital asset with no intrinsic value or guaranteed return. Payouts depend entirely on trading-fee volume and can be zero. Nothing here is investment, legal or tax advice, or an offer to sell securities in any jurisdiction. Not affiliated with Robinhood Markets, Inc. or pump.fun.",
} as const;

export type Site = typeof site;
