# 🏹 Sherwood Protocol ($ARROW)

**Take from the trades. Give to the holders.**

Sherwood Protocol is a Solana token that automates the whole loop of a
fee-funded, self-distributing token:

1. **Launch** on pump.fun (or self-launch via Token-2022 transfer fees — see below).
2. **Harvest** — claim pump.fun's creator-fee share of trading volume.
3. **Split** — a configurable share compounds into the ARROW/SOL liquidity pool, the rest funds a rewards vault.
4. **Snapshot** — every 15 minutes, every holder's balance is recorded.
5. **Airdrop** — the rewards vault pays out pro-rata to every eligible holder, automatically, no claiming.

This repo is the full working implementation: on-chain interactions, the
scheduler/bot, crash-safe payout plans and stats in Supabase, a stats API, and
a website that reads live from it.

## Why "Sherwood," not "Robinhood"

The mechanic mirrors the Robin Hood story — take from the (trading) rich,
give to the (holding) poor — but the project deliberately avoids the actual
"Robinhood" brand name. Using a real brokerage's name/ticker for an
unaffiliated crypto token would misleadingly imply a partnership and likely
infringe their trademark. See `docs/DISCLAIMER.md` for the full rationale
and other legal/risk notes worth reading before you launch this for real.

## Repo layout

```
packages/
  shared/          env config, shared types, versioned doc store (Supabase or JSON files)
  fee-harvester/   claims pump.fun creator fees via PumpPortal (signed locally), splits them into the vaults
  autolp/          deposits the LP-bound share into the Raydium pool
  snapshot-bot/    the 15-min loop: resume → harvest → LP → snapshot → crash-safe airdrop → stats; serves /api/stats
  token-launch/    optional Token-2022 self-launch mint (transfer-fee extension)
  website-v2/      Next.js 16 site (standalone app, deploy to Vercel), reads live stats
supabase/schema.sql  the one table the bot writes and the site reads
deploy/            Railway Dockerfile for the bot (railway.json at the root)
docs/
  ARCHITECTURE.md  data-flow diagram + package responsibilities
  DEPLOYMENT.md    Railway + Supabase + Vercel, step by step
  DISCLAIMER.md    legal / risk / trademark notes. Read before launching publicly.
```

## Quickstart

```bash
npm install && npm run build
cp .env.example .env          # LIVE unset = dry run: reads the chain, sends nothing
npm run start:bot             # cycle + stats API on :4000
cd packages/website-v2 && npm install && BOT_API_URL=http://localhost:4000 npm run dev
npm run typecheck && npm test
```

Full walkthrough: **`docs/DEPLOYMENT.md`**.

## How the fee source actually works

pump.fun tokens are plain SPL mints — there's no per-transfer tax to hook
into. The real lever is pump.fun's **creator-fee sharing** program: the
wallet that creates a coin can claim a share of its trading fees at any
time via a permissionless `collectCreatorFee` instruction. Sherwood's
harvester automates that claim through PumpPortal's local-transaction API (see
`packages/fee-harvester/src/harvestPumpFunCreatorFees.ts`) rather than pretending pump.fun supports an
automatic transfer tax it doesn't. Full details in `docs/ARCHITECTURE.md`.

## Status

This is a complete, readable reference implementation — not a deployed,
funded, live token. No mainnet transaction has been made on your behalf.
Before you launch it for real: read `docs/DISCLAIMER.md`, get independent
legal advice on the securities-law implications of marketing recurring
holder payouts, and consider a multisig for the fee/LP/rewards wallets
instead of single-signer keypairs.

## License

MIT — see the tokenomics/legal notes in `docs/DISCLAIMER.md` for why that
doesn't mean "risk-free to deploy."
