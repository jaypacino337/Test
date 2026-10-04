export interface HolderBalance {
  owner: string;
  tokenAccount: string;
  amount: string; // raw base units, as string (bigint-safe over JSON)
}

export interface HarvestResult {
  source: "pumpfun_creator_fee" | "token2022_transfer_fee";
  /** Net lamports that landed in the fee-authority wallet (balance after − before). */
  lamportsHarvested: string;
  signature: string;
}

// ── Payout plans (crash-safe airdrops) ─────────────────────────────────────

export type BatchStatus = "todo" | "pending" | "sent" | "failed";

export interface PayoutBatch {
  payouts: { owner: string; amountLamports: string }[];
  status: BatchStatus;
  /** Written BEFORE broadcast, so a crash mid-send can be resolved on-chain on restart. */
  signature?: string;
  /** The signed tx can't land after this block height; only then is it safe to re-sign. */
  lastValidBlockHeight?: number;
  attempts: number;
  error?: string;
}

export interface PayoutPlan {
  id: string;
  snapshotId: string;
  createdAt: string;
  potLamports: string;
  batches: PayoutBatch[];
  /** true once every batch is sent or permanently failed. */
  closed: boolean;
}

// ── Stats (what the website reads) ──────────────────────────────────────────

export interface SnapshotSummary {
  id: string;
  takenAt: string; // ISO timestamp
  holderCount: number;
  totalEligibleSupply: string;
  rewardsPoolLamports: string;
}

export interface DistributionRecord {
  snapshotId: string;
  owner: string;
  amountLamports: string;
  signature: string | null;
  status: "pending" | "sent" | "failed";
}

export interface CycleSummary {
  startedAt: string;
  finishedAt: string;
  live: boolean;
  ok: boolean;
  error?: string;
  harvestedLamports: string | null;
  lpDepositedLamports: string | null;
  holderCount: number | null;
  paidHolders: number;
  failedHolders: number;
}

/**
 * The single stats document per mint (jsonb + version in Supabase, or a JSON
 * file on the bot's volume). Totals only count confirmed on-chain transfers,
 * and stay null until the first LIVE cycle, so the site never shows a made-up 0.
 */
export interface SherwoodStats {
  mint: string;
  live: boolean;
  intervalMs: number;
  /** The configured fee route: share of each harvest that goes to liquidity (rest → holders). */
  lpShare: number | null;
  updatedAt: string;
  lastSnapshot: SnapshotSummary | null;
  lastCycle: CycleSummary | null;
  totalHarvestedLamports: string | null;
  totalDistributedLamports: string | null;
  totalLpDepositedLamports: string | null;
  cycles: number;
  /** Payout plans that still have unconfirmed batches. A new airdrop waits until these resolve. */
  openPlanIds: string[];
  recentDistributions: DistributionRecord[];
  /** Last 96 cycles (≈ 24h at 15 min), oldest first. */
  history: { at: string; holderCount: number | null; harvestedLamports: string | null; distributedLamports: string }[];
}

/** GET /api/stats */
export interface StatsResponse {
  mint: string;
  live: boolean;
  lastSnapshot: SnapshotSummary | null;
  lastCycle: CycleSummary | null;
  nextSnapshotAt: string | null;
  lpShare: number | null;
  totalDistributedLamports: string | null;
  totalHarvestedLamports: string | null;
  totalLpDepositedLamports: string | null;
  holderCount: number | null;
  cycles: number;
  history: SherwoodStats["history"];
}
