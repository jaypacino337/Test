# Deployment guide

Three pieces, each on the host that suits it:

| piece | runs on | why |
|---|---|---|
| `packages/snapshot-bot` (+ fee-harvester, autolp) | **Railway** | a long-running loop that holds keys; Vercel kills long processes |
| stats + payout plans | **Supabase** (`sherwood_docs`) | a Vercel site has no disk; the bot and site share one table |
| `packages/website-v2` | **Vercel** | Next.js, previews per PR |

Nothing touches the chain until `LIVE=true`. Run at least a week of dry-run
cycles first, and read `docs/DISCLAIMER.md` before launching publicly.

## 1. Wallets

```bash
mkdir -p keys   # gitignored
solana-keygen new --outfile keys/fee-authority.json   # = the pump.fun creator wallet
solana-keygen new --outfile keys/lp-vault.json
solana-keygen new --outfile keys/rewards-vault.json
```

Launch the coin on pump.fun **from the fee-authority wallet**: pump.fun keys
creator-fee vaults by the creator's pubkey, so only that wallet can claim.

## 2. Supabase

1. Create a project, open the SQL editor, run `supabase/schema.sql`. It creates
   `sherwood_docs` (jsonb + `version`, RLS on, no public policies).
2. Copy the project URL and the **service-role** key. They're server-only, used by
   the bot and by the site's server route, and never `NEXT_PUBLIC_`.

Without Supabase the bot falls back to JSON files under `DATA_DIR/store` (put a
Railway volume at `/data`). The site can then read stats from the bot's API
(`BOT_API_URL`) instead.

## 3. Railway (bot)

New service → this GitHub repo. It picks up `railway.json`
(Dockerfile `deploy/bot.Dockerfile`, healthcheck `/healthz`). Variables:

```
MINT_ADDRESS               = <mint>
RPC_URL                    = https://mainnet.helius-rpc.com/?api-key=…   (dedicated RPC required)
FEE_AUTHORITY_KEYPAIR      = <secret: JSON array or base58>   ← sealed variable
LP_VAULT_KEYPAIR           = <secret>                          ← sealed
REWARDS_VAULT_KEYPAIR      = <secret>                          ← sealed
LP_SHARE                   = 0.5
SUPABASE_URL               = https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = <service key>                     ← sealed
RAYDIUM_POOL_ID            = (only once a Raydium CPMM pool exists)
LIVE                       = (leave unset for the dry-run week, then "true")
```

Without Supabase, also add a volume at `/data` and `RAILWAY_RUN_UID=0` (volumes
mount as root).

What a cycle does (every `SNAPSHOT_INTERVAL_MS`, never overlapping):

1. finish any payout plan an earlier cycle left open
2. claim creator fees (PumpPortal, signed locally) and split the fee-authority balance into the two vaults
3. auto-LP the LP vault into Raydium (if `RAYDIUM_POOL_ID` is set)
4. snapshot holders (PDAs such as the bonding curve and pools are excluded)
5. airdrop the rewards vault pro-rata as a frozen plan; every batch's signature is stored before broadcast
6. write the stats doc the website reads

`SIGTERM` (every Railway redeploy) lets the current cycle finish before exiting.
After a crash, step 1 resolves any in-flight batch on-chain before anything is
re-sent, so a holder is never paid twice.

## 4. Vercel (site)

Import the repo → **Root Directory `packages/website-v2`** → framework is detected. Env:

```
NEXT_PUBLIC_MINT_ADDRESS   = <mint>        (empty = "appears at launch")
NEXT_PUBLIC_SITE_URL       = https://<domain>
SUPABASE_URL               = …             (server-only)
SUPABASE_SERVICE_ROLE_KEY  = …             (server-only)
BOT_API_URL                = https://<railway-service>.up.railway.app   (fallback if no Supabase)
```

Every number on the page is either real (bot stats or DexScreener) or "—".

Gate before promoting: `npm run build && npm start`, then
`mc qa http://localhost:3000` (memcoinz) with 0 failures.

## Local

```bash
npm install && npm run build
cp .env.example .env              # fill in; LIVE unset = dry run
npm run start:bot                 # cycle + stats API on :4000
cd packages/website-v2 && npm install && BOT_API_URL=http://localhost:4000 npm run dev
npm run typecheck && npm test
```
