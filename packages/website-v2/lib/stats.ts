import "server-only";
import { site } from "./site";

/**
 * Everything the page shows that comes from the outside world. Every field is
 * nullable: null renders as "—", never as a made-up number.
 */
export interface SiteStats {
  /** where the numbers came from; "none" = nothing configured or reachable */
  source: "supabase" | "bot" | "none";
  /** bot state: live (sending), dry-run (reading only), offline (no fresh data) */
  status: "live" | "dry-run" | "offline";
  mint: string | null;
  holderCount: number | null;
  nextSnapshotAt: string | null;
  lastCycleAt: string | null;
  lastCycleOk: boolean | null;
  totalDistributedSol: number | null;
  totalHarvestedSol: number | null;
  totalLpSol: number | null;
  rewardsQueuedSol: number | null;
  lpShare: number | null;
  cycles: number | null;
  recent: { owner: string; sol: number; signature: string | null; status: string }[];
  market: { priceUsd: number | null; marketCapUsd: number | null; volume24hUsd: number | null; liquidityUsd: number | null; url: string | null } | null;
}

interface BotDoc {
  mint: string;
  live: boolean;
  intervalMs: number;
  lpShare?: number | null;
  updatedAt?: string;
  lastSnapshot: { holderCount: number; rewardsPoolLamports: string } | null;
  lastCycle: { startedAt: string; ok: boolean } | null;
  nextSnapshotAt?: string | null;
  totalHarvestedLamports: string | null;
  totalDistributedLamports: string | null;
  totalLpDepositedLamports: string | null;
  cycles: number;
  recentDistributions?: { owner: string; amountLamports: string; signature: string | null; status: string }[];
}

const MINT_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const sol = (lamports: string | null | undefined) => (lamports == null ? null : Number(BigInt(lamports)) / 1e9);

async function fromSupabase(mint: string): Promise<BotDoc | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/sherwood_docs?select=doc&key=eq.${encodeURIComponent(`stats:${mint}`)}`, {
    headers: { apikey: key, authorization: `Bearer ${key}` },
    next: { revalidate: 15 },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as { doc: BotDoc }[];
  return rows[0]?.doc ?? null;
}

async function fromBot(): Promise<BotDoc | null> {
  const base = process.env.BOT_API_URL;
  if (!base) return null;
  const [stats, recent] = await Promise.all([
    fetch(`${base.replace(/\/$/, "")}/api/stats`, { next: { revalidate: 15 }, signal: AbortSignal.timeout(8_000) }),
    fetch(`${base.replace(/\/$/, "")}/api/distributions/recent?limit=12`, { next: { revalidate: 15 }, signal: AbortSignal.timeout(8_000) }),
  ]);
  if (!stats.ok) throw new Error(`bot ${stats.status}`);
  const doc = (await stats.json()) as BotDoc;
  doc.recentDistributions = recent.ok ? await recent.json() : [];
  return doc;
}

async function market(mint: string | null): Promise<SiteStats["market"]> {
  if (!mint) return null;
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { pairs?: { priceUsd?: string; marketCap?: number; fdv?: number; volume?: { h24?: number }; liquidity?: { usd?: number }; url?: string }[] | null };
    const pair = (json.pairs ?? []).sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    if (!pair) return null;
    return {
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
      marketCapUsd: pair.marketCap ?? pair.fdv ?? null,
      volume24hUsd: pair.volume?.h24 ?? null,
      liquidityUsd: pair.liquidity?.usd ?? null,
      url: pair.url ?? null,
    };
  } catch {
    return null;
  }
}

const STALE_AFTER_INTERVALS = 3;

export async function getSiteStats(): Promise<SiteStats> {
  const configuredMint = MINT_RE.test(site.ca) ? site.ca : null;
  let doc: BotDoc | null = null;
  let source: SiteStats["source"] = "none";
  try {
    if (configuredMint && (doc = await fromSupabase(configuredMint))) source = "supabase";
    else if ((doc = await fromBot())) source = "bot";
  } catch {
    doc = null;
  }
  const mint = configuredMint ?? (doc && MINT_RE.test(doc.mint) ? doc.mint : null);

  const lastAt = doc?.lastCycle?.startedAt ?? null;
  const fresh = !!doc && !!lastAt && Date.now() - Date.parse(lastAt) < (doc.intervalMs || 900_000) * STALE_AFTER_INTERVALS;
  const status: SiteStats["status"] = !fresh ? "offline" : doc!.live ? "live" : "dry-run";
  const nextSnapshotAt = doc?.nextSnapshotAt ?? (lastAt && doc ? new Date(Date.parse(lastAt) + doc.intervalMs).toISOString() : null);

  return {
    source,
    status,
    mint,
    holderCount: doc?.lastSnapshot?.holderCount ?? null,
    nextSnapshotAt: fresh ? nextSnapshotAt : null,
    lastCycleAt: lastAt,
    lastCycleOk: doc?.lastCycle?.ok ?? null,
    totalDistributedSol: sol(doc?.totalDistributedLamports),
    totalHarvestedSol: sol(doc?.totalHarvestedLamports),
    totalLpSol: sol(doc?.totalLpDepositedLamports),
    rewardsQueuedSol: doc?.lastSnapshot ? sol(doc.lastSnapshot.rewardsPoolLamports) : null,
    lpShare: doc?.lpShare ?? null,
    cycles: doc ? doc.cycles : null,
    recent: (doc?.recentDistributions ?? []).slice(0, 12).map((r) => ({ owner: r.owner, sol: sol(r.amountLamports) ?? 0, signature: r.signature, status: r.status })),
    market: await market(mint),
  };
}
