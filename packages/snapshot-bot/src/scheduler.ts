import { loadConfig, makeConnection } from "@sherwood/shared";
import type { DistributionRecord, DocStore, PayoutBatch, PayoutPlan, SherwoodConfig, SherwoodStats } from "@sherwood/shared";
import { runHarvestCycle } from "@sherwood/fee-harvester";
import { runAutoLpCycle } from "@sherwood/autolp";
import { fetchHolders } from "./holders";
import { batchTotal, computePayouts, dropUnfundable, executePlan, makePlan } from "./distribute";
import { addLamports, emptyStats, planKey, pushHistory, pushRecent, statsKey } from "./stats";

const VAULT_RESERVE_LAMPORTS = 10_000_000n; // 0.01 SOL stays in the rewards vault for tx fees

const records = (snapshotId: string, batches: PayoutBatch[], status: DistributionRecord["status"]): DistributionRecord[] =>
  batches.flatMap((b) => b.payouts.map((p) => ({ snapshotId, owner: p.owner, amountLamports: p.amountLamports, signature: b.signature ?? null, status })));

/**
 * One full tick of the protocol:
 *   1. finish any payout plan an earlier cycle left open (crash, timeout)
 *   2. claim pump.fun creator fees and split them into the LP / rewards vaults
 *   3. top up the liquidity pool
 *   4. snapshot every holder
 *   5. airdrop the rewards vault pro-rata, as a new crash-safe plan
 *   6. write stats for the website
 * Nothing is sent unless LIVE=true; a dry run reads the chain and logs the plan.
 */
export async function runFullCycle(store: DocStore, config: SherwoodConfig = loadConfig()) {
  const connection = makeConnection(config.rpcUrl);
  const mint = config.mint.toBase58();
  const live = config.live;
  const startedAt = new Date().toISOString();
  console.log(`[scheduler] ${live ? "LIVE" : "DRY RUN"} cycle starting @ ${startedAt}`);

  let distributed = 0n;
  let paidHolders = 0;
  let failedHolders = 0;
  const recent: DistributionRecord[] = [];
  const stats0 = (await store.get<SherwoodStats>(statsKey(mint))) ?? emptyStats(mint, config.snapshotIntervalMs, live);
  let openPlanIds = [...stats0.openPlanIds];

  const settle = (snapshotId: string, r: { newlySent: PayoutBatch[]; newlyFailed: PayoutBatch[] }) => {
    for (const b of r.newlySent) {
      distributed += batchTotal(b);
      paidHolders += b.payouts.length;
    }
    for (const b of r.newlyFailed) failedHolders += b.payouts.length;
    recent.push(...records(snapshotId, r.newlySent, "sent"), ...records(snapshotId, r.newlyFailed, "failed"));
  };

  // 1. resume
  if (live) {
    for (const key of stats0.openPlanIds) {
      const r = await executePlan(connection, config.rewardsVaultKeypair, store, key);
      settle(r.plan.snapshotId, r);
      if (r.plan.closed) openPlanIds = openPlanIds.filter((k) => k !== key);
      console.log(`[scheduler] resumed plan ${key}: ${r.newlySent.length} batch(es) confirmed, ${r.plan.closed ? "closed" : "still open"}`);
    }
  }

  // 2-3. harvest + LP (each step is isolated: a failure doesn't block the airdrop)
  let harvested: bigint | null = null;
  const harvest = await runHarvestCycle().catch((err) => {
    console.error("[scheduler] harvest step failed (continuing with existing vault balance):", err.message);
    return null;
  });
  if (harvest && live) harvested = harvest.pumpResults.reduce((s, r) => s + BigInt(r.lamportsHarvested), 0n);

  const lp = await runAutoLpCycle().catch((err) => {
    console.error("[scheduler] auto-LP step failed (continuing):", err.message);
    return null;
  });
  const lpDeposited = lp ? BigInt(lp.inputAmountLamports) : null;

  // 4. snapshot (read-only, so it runs in dry runs too: the holder count is real either way)
  const holders = await fetchHolders(connection, config.mint, config.excludedOwners, config.minEligibleBalance);
  const totalEligibleSupply = holders.reduce((sum, h) => sum + BigInt(h.amount), 0n);
  const rewardsBalance = BigInt(await connection.getBalance(config.rewardsVaultKeypair.publicKey));
  const rewardsPoolLamports = rewardsBalance > VAULT_RESERVE_LAMPORTS ? rewardsBalance - VAULT_RESERVE_LAMPORTS : 0n;
  const snapshotId = `${Date.parse(startedAt)}`;

  // 5. airdrop: never start a new plan while an old one is unresolved, or the pot
  //    (the vault balance) would include SOL already promised to that plan's holders
  if (openPlanIds.length) {
    console.log(`[scheduler] ${openPlanIds.length} payout plan(s) still unresolved; skipping a new airdrop this cycle`);
  } else {
    const payouts = await dropUnfundable(connection, computePayouts(holders, rewardsPoolLamports));
    console.log(`[scheduler] snapshot ${snapshotId}: ${holders.length} eligible holders, ${payouts.length} qualify for a payout`);
    if (payouts.length > 0 && live) {
      const key = planKey(mint, snapshotId);
      const plan = makePlan(key, snapshotId, rewardsPoolLamports, payouts);
      await store.update<PayoutPlan>(key, (existing) => existing ?? plan);
      openPlanIds.push(key);
      // record the plan as open BEFORE sending, so a crash mid-airdrop is resumed next boot
      await store.update<SherwoodStats>(statsKey(mint), (s) => ({ ...(s ?? stats0), openPlanIds: [...openPlanIds] }));
      const r = await executePlan(connection, config.rewardsVaultKeypair, store, key);
      settle(snapshotId, r);
      if (r.plan.closed) openPlanIds = openPlanIds.filter((k) => k !== key);
      console.log(`[scheduler] airdropped to ${paidHolders} holder(s), ${failedHolders} failed permanently`);
    } else if (payouts.length > 0) {
      const total = payouts.reduce((s, p) => s + p.amountLamports, 0n);
      console.log(`[scheduler] dry run: would airdrop ${total} lamports to ${payouts.length} holders (set LIVE=true to send)`);
    }
  }

  // 6. stats
  const finishedAt = new Date().toISOString();
  await store.update<SherwoodStats>(statsKey(mint), (prev) => {
    const s = prev ?? emptyStats(mint, config.snapshotIntervalMs, live);
    s.live = live;
    s.intervalMs = config.snapshotIntervalMs;
    s.lpShare = config.lpShare;
    s.updatedAt = finishedAt;
    s.cycles += 1;
    s.openPlanIds = openPlanIds;
    s.lastSnapshot = {
      id: snapshotId,
      takenAt: startedAt,
      holderCount: holders.length,
      totalEligibleSupply: totalEligibleSupply.toString(),
      rewardsPoolLamports: rewardsPoolLamports.toString(),
    };
    s.lastCycle = {
      startedAt,
      finishedAt,
      live,
      ok: true,
      harvestedLamports: harvested === null ? null : harvested.toString(),
      lpDepositedLamports: lpDeposited === null ? null : lpDeposited.toString(),
      holderCount: holders.length,
      paidHolders,
      failedHolders,
    };
    if (live) {
      s.totalHarvestedLamports = addLamports(s.totalHarvestedLamports, harvested ?? 0n);
      s.totalDistributedLamports = addLamports(s.totalDistributedLamports, distributed);
      s.totalLpDepositedLamports = addLamports(s.totalLpDepositedLamports, lpDeposited ?? 0n);
    }
    pushRecent(s, recent);
    pushHistory(s, {
      at: startedAt,
      holderCount: holders.length,
      harvestedLamports: harvested === null ? null : harvested.toString(),
      distributedLamports: distributed.toString(),
    });
    return s;
  });

  console.log(`[scheduler] cycle complete @ ${finishedAt}`);
}

/** Records a cycle that threw before it could write stats, so the site can show the bot's real state. */
export async function recordFailedCycle(store: DocStore, config: SherwoodConfig, startedAt: string, err: Error) {
  const mint = config.mint.toBase58();
  await store.update<SherwoodStats>(statsKey(mint), (prev) => {
    const s = prev ?? emptyStats(mint, config.snapshotIntervalMs, config.live);
    s.updatedAt = new Date().toISOString();
    s.lastCycle = {
      startedAt,
      finishedAt: s.updatedAt,
      live: config.live,
      ok: false,
      error: err.message.slice(0, 300),
      harvestedLamports: null,
      lpDepositedLamports: null,
      holderCount: null,
      paidHolders: 0,
      failedHolders: 0,
    };
    return s;
  });
}

/**
 * Runs a cycle now and then every SNAPSHOT_INTERVAL_MS. Cycles never overlap
 * (the old node-cron version could start a second payout run while the first
 * was still sending). `stop()` lets the current cycle finish first, so a
 * payout batch is never abandoned mid-flight.
 */
export function startScheduler(store: DocStore) {
  const config = loadConfig();
  let stopping = false;
  let timer: NodeJS.Timeout | null = null;
  let current: Promise<void> | null = null;

  console.log(`[scheduler] every ${Math.round(config.snapshotIntervalMs / 60_000)} min · ${config.live ? "LIVE" : "DRY RUN (set LIVE=true to send)"} · store: ${store.kind}`);

  const tick = () => {
    const startedAt = new Date().toISOString();
    const cfg = loadConfig(); // re-read env each cycle
    current = runFullCycle(store, cfg)
      .catch(async (err) => {
        console.error("[scheduler] cycle threw:", err);
        await recordFailedCycle(store, cfg, startedAt, err).catch(() => {});
      })
      .finally(() => {
        current = null;
        if (!stopping) timer = setTimeout(tick, cfg.snapshotIntervalMs);
      });
  };
  tick();

  return {
    async stop() {
      stopping = true;
      if (timer) clearTimeout(timer);
      if (current) await current;
    },
  };
}
