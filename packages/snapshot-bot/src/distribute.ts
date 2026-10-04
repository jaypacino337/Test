/**
 * Pro-rata SOL airdrops that can't double-pay.
 *
 * The old version sent batches and only wrote the result to SQLite afterwards:
 * a crash or a confirmation timeout after a batch landed meant the next run had
 * no record of it, and a retry paid those holders again. Now every airdrop is a
 * frozen PayoutPlan in the store, and each batch goes through:
 *
 *   todo ──sign──▶ pending{signature, lastValidBlockHeight} ──(persisted FIRST)──▶ broadcast ──▶ sent
 *
 * On restart a "pending" batch is resolved on-chain before anything is re-sent:
 *   - signature confirmed            → sent (never re-sent)
 *   - confirmed with an error        → failed (nothing moved; retried with a new tx, max 3 attempts)
 *   - unknown, blockhash still valid → left pending (it may still land)
 *   - unknown, blockhash expired     → it can never land, so it is safe to re-sign
 */
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { base58Encode } from "@sherwood/shared";
import type { DocStore, HolderBalance, PayoutBatch, PayoutPlan } from "@sherwood/shared";

export interface Payout {
  owner: string;
  amountLamports: bigint;
}

/** The RPC surface the payout engine needs (a real Connection, or a fake in tests). */
export type PayoutConnection = Pick<
  Connection,
  | "getLatestBlockhash"
  | "sendRawTransaction"
  | "confirmTransaction"
  | "getSignatureStatuses"
  | "getBlockHeight"
  | "getMultipleAccountsInfo"
  | "getMinimumBalanceForRentExemption"
>;

// Legacy transactions cap at 1232 bytes; 10 system transfers leave headroom.
export const CHUNK_SIZE = 10;
export const MAX_ATTEMPTS = 3;

// Below this, the SOL transfer would cost more in network fees than a
// holder actually receives — skip it rather than waste rewards-pool funds.
const MIN_PAYOUT_LAMPORTS = 1_000n;

/** Integer pro-rata split, rounded down: the sum never exceeds the pot; dust stays in the vault. */
export function computePayouts(holders: HolderBalance[], rewardsPoolLamports: bigint): Payout[] {
  if (rewardsPoolLamports <= 0n || holders.length === 0) return [];

  const totalEligibleSupply = holders.reduce((sum, h) => sum + BigInt(h.amount), 0n);
  if (totalEligibleSupply === 0n) return [];

  return holders
    .map((h) => ({
      owner: h.owner,
      amountLamports: (BigInt(h.amount) * rewardsPoolLamports) / totalEligibleSupply,
    }))
    .filter((p) => p.amountLamports >= MIN_PAYOUT_LAMPORTS);
}

/**
 * The runtime rejects a transfer that would create an account below
 * rent-exemption, and that failure takes the whole batch down with it. Drop
 * those payouts (their share stays in the vault for the next cycle).
 */
export async function dropUnfundable(conn: PayoutConnection, payouts: Payout[]): Promise<Payout[]> {
  const rentMin = BigInt(await conn.getMinimumBalanceForRentExemption(0));
  const small = payouts.filter((p) => p.amountLamports < rentMin);
  const missing = new Set<string>();
  for (let i = 0; i < small.length; i += 100) {
    const chunk = small.slice(i, i + 100);
    const infos = await conn.getMultipleAccountsInfo(chunk.map((p) => new PublicKey(p.owner)));
    chunk.forEach((p, j) => {
      if (!infos[j]) missing.add(p.owner);
    });
  }
  return payouts.filter((p) => !missing.has(p.owner));
}

export function makePlan(id: string, snapshotId: string, potLamports: bigint, payouts: Payout[], chunkSize = CHUNK_SIZE): PayoutPlan {
  const batches: PayoutBatch[] = [];
  for (let i = 0; i < payouts.length; i += chunkSize) {
    batches.push({
      payouts: payouts.slice(i, i + chunkSize).map((p) => ({ owner: p.owner, amountLamports: p.amountLamports.toString() })),
      status: "todo",
      attempts: 0,
    });
  }
  return { id, snapshotId, createdAt: new Date().toISOString(), potLamports: potLamports.toString(), batches, closed: batches.length === 0 };
}

export const batchTotal = (b: PayoutBatch) => b.payouts.reduce((s, p) => s + BigInt(p.amountLamports), 0n);

const isDone = (b: PayoutBatch) => b.status === "sent" || (b.status === "failed" && b.attempts >= MAX_ATTEMPTS);

export interface ExecuteResult {
  plan: PayoutPlan;
  /** Batches that became "sent" during this call (count these into stats exactly once). */
  newlySent: PayoutBatch[];
  /** Batches that hit MAX_ATTEMPTS during this call. */
  newlyFailed: PayoutBatch[];
}

/**
 * Runs (or resumes) the plan stored under `key`. Safe to call any number of
 * times, from a fresh process, after any crash: a batch is only ever signed
 * again once its previous signature provably can't land.
 */
export async function executePlan(conn: PayoutConnection, vault: Keypair, store: DocStore, key: string): Promise<ExecuteResult> {
  const newlySent: PayoutBatch[] = [];
  const newlyFailed: PayoutBatch[] = [];
  const setBatch = async (i: number, patch: Partial<PayoutBatch>) => {
    const plan = await store.update<PayoutPlan>(key, (p) => {
      if (!p) throw new Error(`plan ${key} disappeared`);
      p.batches[i] = { ...p.batches[i], ...patch };
      p.closed = p.batches.every(isDone);
      return p;
    });
    const b = plan.batches[i];
    if (patch.status === "sent") newlySent.push(b);
    if (patch.status === "failed" && b.attempts >= MAX_ATTEMPTS) newlyFailed.push(b);
    return b;
  };

  const initial = await store.get<PayoutPlan>(key);
  if (!initial) throw new Error(`no payout plan stored under ${key}`);

  for (let i = 0; i < initial.batches.length; i++) {
    let batch = initial.batches[i];
    if (isDone(batch)) continue;

    if (batch.status === "pending" && batch.signature) {
      const { value } = await conn.getSignatureStatuses([batch.signature], { searchTransactionHistory: true });
      const st = value[0];
      if (st && (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized")) {
        batch = await setBatch(i, st.err ? { status: "failed", error: JSON.stringify(st.err) } : { status: "sent" });
        if (batch.status === "sent") continue;
      } else if (st) {
        continue; // processed but not confirmed yet: it may still land, check next cycle
      } else {
        const height = await conn.getBlockHeight("confirmed");
        if (height <= (batch.lastValidBlockHeight ?? Number.MAX_SAFE_INTEGER)) continue; // may still land
        // expired and never seen: provably dropped, safe to re-sign below
      }
      if (isDone(batch)) continue;
    }

    // todo, failed (attempts left), or an expired pending batch → sign a fresh tx
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
    const tx = new Transaction({ feePayer: vault.publicKey, blockhash, lastValidBlockHeight });
    for (const p of batch.payouts) {
      tx.add(SystemProgram.transfer({ fromPubkey: vault.publicKey, toPubkey: new PublicKey(p.owner), lamports: BigInt(p.amountLamports) }));
    }
    tx.sign(vault);
    const signature = base58Encode(tx.signature!);
    // persist BEFORE broadcasting: if we die after this line, the next run finds the signature
    batch = await setBatch(i, { status: "pending", signature, lastValidBlockHeight, attempts: batch.attempts + 1, error: undefined });
    try {
      await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
      const res = await conn.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      if (res.value.err) {
        await setBatch(i, { status: "failed", error: JSON.stringify(res.value.err) });
      } else {
        await setBatch(i, { status: "sent" });
      }
    } catch (err) {
      // Unknown outcome (timeout, RPC error, preflight reject): stay "pending" and let the
      // next run resolve it on-chain. A preflight reject simply expires and is re-signed.
      const message = (err as Error).message.split("\n")[0].slice(0, 200);
      console.error(`[distribute] batch ${i + 1}/${initial.batches.length} unresolved: ${message}`);
      await setBatch(i, { error: message });
    }
  }

  const plan = (await store.get<PayoutPlan>(key))!;
  return { plan, newlySent, newlyFailed };
}
