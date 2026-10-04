import { loadConfig, makeConnection } from "@sherwood/shared";
import { harvestPumpFunCreatorFees } from "./harvestPumpFunCreatorFees";
import { splitHarvestedFees } from "./splitFees";

export {
  claimableCreatorFees,
  deriveAmmCreatorVault,
  deriveBondingCurveCreatorVault,
  harvestPumpFunCreatorFees,
} from "./harvestPumpFunCreatorFees";
export { harvestTransferFees } from "./harvestTransferFees";
export { splitHarvestedFees } from "./splitFees";

/**
 * One harvest cycle: claim pump.fun creator fees, then split the fee-authority
 * balance into the LP / rewards vaults. Sends only when LIVE=true; otherwise it
 * reads the chain and logs what it would do. Called by the snapshot-bot every
 * cycle, or run standalone via `npm run harvest`.
 */
export async function runHarvestCycle() {
  const config = loadConfig();
  const connection = makeConnection(config.rpcUrl);
  const send = config.live;

  console.log(`[harvester] ${send ? "LIVE" : "dry run"}: claiming pump.fun creator fees...`);
  const pumpResults = await harvestPumpFunCreatorFees(connection, config.feeAuthorityKeypair, { send }).catch((err) => {
    console.warn("[harvester] pump.fun claim skipped:", err.message);
    return [];
  });
  pumpResults.forEach((r) => console.log(`[harvester] +${r.lamportsHarvested} lamports (${r.signature})`));

  console.log("[harvester] splitting fee-authority balance into LP / rewards vaults...");
  const split = await splitHarvestedFees(
    connection,
    config.feeAuthorityKeypair,
    config.lpVaultKeypair.publicKey,
    config.rewardsVaultKeypair.publicKey,
    config.lpShare,
    send
  );
  console.log(
    `[harvester] -> LP vault: ${split.toLp} lamports, rewards vault: ${split.toRewards} lamports`,
    split.signature ?? (send ? "(nothing to split)" : "(dry run, not sent)")
  );

  return { pumpResults, split };
}

if (require.main === module) {
  runHarvestCycle()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
