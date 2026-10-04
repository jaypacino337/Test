/**
 * Claims Sherwood's pump.fun creator rewards.
 *
 * pump.fun mints plain SPL tokens on a bonding curve, so there is no
 * per-transfer tax to intercept. Instead, pump.fun accrues a share of trading
 * fees into per-creator vaults that the creator wallet can claim:
 *   - bonding curve:  PDA ["creator-vault", creator] under the Pump program (SOL)
 *   - after graduation: PumpSwap's ["creator_vault", creator] authority, whose
 *     WSOL token account holds the fees
 *
 * The claim is built by PumpPortal's trade-local API (action
 * "collectCreatorFee") and signed here, locally: no API key, and the key
 * never leaves this process. PumpPortal tracks pump.fun's instruction changes
 * (e.g. collect_creator_fee → _v2), which is why this replaced the previous
 * `require("@pump-fun/pump-sdk")` call: that package was never a dependency,
 * so every claim threw, and its function names drift between versions.
 * One pump.fun claim sweeps the fees of every coin this creator launched.
 */
import { Connection, Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { NATIVE_MINT, getAssociatedTokenAddressSync } from "@solana/spl-token";
import type { HarvestResult } from "@sherwood/shared";

export const PUMP_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");
export const PUMP_SWAP_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
export const PUMPPORTAL_TRADE_LOCAL = "https://pumpportal.fun/api/trade-local";

export function deriveBondingCurveCreatorVault(creator: PublicKey): PublicKey {
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator-vault"), creator.toBuffer()],
    PUMP_PROGRAM_ID
  );
  return vault;
}

export function deriveAmmCreatorVault(coinCreator: PublicKey): PublicKey {
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("creator_vault"), coinCreator.toBuffer()],
    PUMP_SWAP_PROGRAM_ID
  );
  return vault;
}

/** What's claimable right now. The bonding vault keeps its rent-exempt minimum, so that part is excluded. */
export async function claimableCreatorFees(connection: Connection, creator: PublicKey) {
  const ammWsol = getAssociatedTokenAddressSync(NATIVE_MINT, deriveAmmCreatorVault(creator), true);
  const [bondingLamports, rent, amm] = await Promise.all([
    connection.getBalance(deriveBondingCurveCreatorVault(creator)),
    connection.getMinimumBalanceForRentExemption(0),
    connection.getTokenAccountBalance(ammWsol).catch(() => null),
  ]);
  const bonding = BigInt(Math.max(0, bondingLamports - rent));
  const pumpSwap = BigInt(amm?.value.amount ?? "0");
  return { bonding, pumpSwap, total: bonding + pumpSwap };
}

export interface HarvestOptions {
  /** false = report what's claimable and stop (the default everywhere unless LIVE=true). */
  send: boolean;
  priorityFeeSol?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Claims accrued creator fees (bonding curve + PumpSwap in one PumpPortal tx)
 * and reports the NET lamports that landed (balance after − before), not the
 * vault balance, so stats never count rent or fees as harvest.
 */
export async function harvestPumpFunCreatorFees(
  connection: Connection,
  creator: Keypair,
  opts: HarvestOptions = { send: false }
): Promise<HarvestResult[]> {
  const claimable = await claimableCreatorFees(connection, creator.publicKey);
  console.log(
    `[harvester] claimable: bonding ${claimable.bonding} + PumpSwap ${claimable.pumpSwap} = ${claimable.total} lamports`
  );
  if (claimable.total === 0n || !opts.send) return [];

  const before = BigInt(await connection.getBalance(creator.publicKey));
  const res = await (opts.fetchImpl ?? fetch)(PUMPPORTAL_TRADE_LOCAL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      publicKey: creator.publicKey.toBase58(),
      action: "collectCreatorFee",
      priorityFee: opts.priorityFeeSol ?? 0.000001,
      pool: "pump",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status !== 200) throw new Error(`PumpPortal collectCreatorFee failed (${res.status}): ${(await res.text()).slice(0, 200)}`);

  const tx = VersionedTransaction.deserialize(new Uint8Array(await res.arrayBuffer()));
  // Refuse anything that isn't paid for by, and only needs, the creator: PumpPortal is a third party.
  const keys = tx.message.staticAccountKeys;
  if (!keys[0]?.equals(creator.publicKey) || tx.message.header.numRequiredSignatures !== 1) {
    throw new Error("PumpPortal returned a transaction with an unexpected fee payer or signer set; not signing it");
  }
  tx.sign([creator]);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  const signature = await connection.sendTransaction(tx, { maxRetries: 3 });
  const confirmed = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (confirmed.value.err) throw new Error(`claim ${signature} failed: ${JSON.stringify(confirmed.value.err)}`);

  const after = BigInt(await connection.getBalance(creator.publicKey));
  const net = after > before ? after - before : 0n;
  return [{ source: "pumpfun_creator_fee", lamportsHarvested: net.toString(), signature }];
}
