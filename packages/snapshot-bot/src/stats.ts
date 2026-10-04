import type { DistributionRecord, SherwoodStats, StatsResponse } from "@sherwood/shared";

export const statsKey = (mint: string) => `stats:${mint}`;
export const planKey = (mint: string, snapshotId: string) => `plan:${mint.slice(0, 8)}:${snapshotId}`;

const HISTORY = 96;
const RECENT = 200;

export function emptyStats(mint: string, intervalMs: number, live: boolean): SherwoodStats {
  return {
    mint,
    live,
    intervalMs,
    lpShare: null,
    updatedAt: new Date().toISOString(),
    lastSnapshot: null,
    lastCycle: null,
    totalHarvestedLamports: null,
    totalDistributedLamports: null,
    totalLpDepositedLamports: null,
    cycles: 0,
    openPlanIds: [],
    recentDistributions: [],
    history: [],
  };
}

/** Adds to a nullable lamport total. Totals become non-null at the first LIVE cycle, even if it moved 0. */
export const addLamports = (total: string | null, delta: bigint) => (BigInt(total ?? "0") + delta).toString();

export function pushRecent(stats: SherwoodStats, rows: DistributionRecord[]) {
  stats.recentDistributions = [...rows, ...stats.recentDistributions].slice(0, RECENT);
}

export function pushHistory(stats: SherwoodStats, row: SherwoodStats["history"][number]) {
  stats.history = [...stats.history, row].slice(-HISTORY);
}

export function toResponse(stats: SherwoodStats | null, mint: string, intervalMs: number, live: boolean): StatsResponse {
  const s = stats ?? emptyStats(mint, intervalMs, live);
  const nextSnapshotAt = s.lastCycle ? new Date(new Date(s.lastCycle.startedAt).getTime() + s.intervalMs).toISOString() : null;
  return {
    mint: s.mint,
    live: s.live,
    lastSnapshot: s.lastSnapshot,
    lastCycle: s.lastCycle,
    nextSnapshotAt,
    lpShare: s.lpShare,
    totalDistributedLamports: s.totalDistributedLamports,
    totalHarvestedLamports: s.totalHarvestedLamports,
    totalLpDepositedLamports: s.totalLpDepositedLamports,
    holderCount: s.lastSnapshot?.holderCount ?? null,
    cycles: s.cycles,
    history: s.history,
  };
}
