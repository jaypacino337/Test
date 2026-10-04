import { Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import { base58Decode } from "./base58";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env var: ${name}. See .env.example.`);
  }
  return v;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/** Parses a secret key written as a JSON byte array (solana-keygen) or a base58 string (Phantom export). */
export function parseSecretKey(raw: string): Keypair {
  const text = raw.trim();
  if (text.startsWith("[")) return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(text)));
  return Keypair.fromSecretKey(base58Decode(text));
}

/**
 * Loads a keypair from `<NAME>` (the secret itself, e.g. a Railway sealed
 * variable) or, failing that, from the file at `<NAME>_PATH`. The secret is
 * never logged.
 */
function loadKeypair(name: string): Keypair {
  const inline = process.env[name];
  if (inline) return parseSecretKey(inline);
  const file = process.env[`${name}_PATH`];
  if (!file) throw new Error(`Missing ${name} (secret) or ${name}_PATH (keypair file). See .env.example.`);
  return parseSecretKey(fs.readFileSync(file, "utf-8"));
}

export interface SherwoodConfig {
  rpcUrl: string;
  mint: PublicKey;
  /** The pump.fun creator wallet: claims creator fees and splits them into the two vaults. */
  feeAuthorityKeypair: Keypair;
  /** Vault that accumulates the LP-bound share of harvested fees and signs the auto-LP deposit txs. */
  lpVaultKeypair: Keypair;
  /** Vault that accumulates the holder-rewards share of harvested fees, and pays out airdrops. */
  rewardsVaultKeypair: Keypair;
  /** Fraction (0-1) of harvested fees routed to the LP vault. Remainder goes to holder rewards. */
  lpShare: number;
  /** How often holders are snapshotted and paid, in milliseconds. Default: 15 minutes. */
  snapshotIntervalMs: number;
  /** Owners excluded from snapshots. The protocol's own three wallets are always added. */
  excludedOwners: Set<string>;
  /** Minimum token balance (raw base units) required to be eligible for an airdrop. */
  minEligibleBalance: bigint;
  pumpFunProgramId: PublicKey;
  /** Raydium CPMM pool for auto-LP. Unset = LP share accumulates in the LP vault. */
  raydiumPoolId: string | null;
  /** Only `LIVE=true` sends transactions. Anything else is a dry run that reads the chain and logs the plan. */
  live: boolean;
  /** Where the file-backed store keeps its JSON docs (mount a Railway volume here). */
  dataDir: string;
  /** Supabase REST URL + service-role key; when both are set, stats and payout plans live there. */
  supabaseUrl: string | null;
  supabaseServiceKey: string | null;
  apiPort: number;
}

export function loadConfig(): SherwoodConfig {
  const rpcUrl = optionalEnv("RPC_URL", optionalEnv("SOLANA_RPC_URL", "https://api.devnet.solana.com"));
  const mint = new PublicKey(requireEnv("MINT_ADDRESS"));
  const feeAuthorityKeypair = loadKeypair("FEE_AUTHORITY_KEYPAIR");
  const lpVaultKeypair = loadKeypair("LP_VAULT_KEYPAIR");
  const rewardsVaultKeypair = loadKeypair("REWARDS_VAULT_KEYPAIR");
  const lpShare = Number(optionalEnv("LP_SHARE", "0.5"));
  const snapshotIntervalMs = Number(optionalEnv("SNAPSHOT_INTERVAL_MS", String(15 * 60 * 1000)));
  const excludedOwners = new Set(
    optionalEnv("EXCLUDED_OWNERS", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  // never airdrop to ourselves
  for (const kp of [feeAuthorityKeypair, lpVaultKeypair, rewardsVaultKeypair]) excludedOwners.add(kp.publicKey.toBase58());
  const minEligibleBalance = BigInt(optionalEnv("MIN_ELIGIBLE_BALANCE", "1"));
  const pumpFunProgramId = new PublicKey(
    optionalEnv("PUMPFUN_PROGRAM_ID", "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P")
  );

  if (!(lpShare >= 0 && lpShare <= 1)) {
    throw new Error("LP_SHARE must be between 0 and 1");
  }
  if (!(snapshotIntervalMs >= 60_000)) {
    throw new Error("SNAPSHOT_INTERVAL_MS must be at least 60000 (1 minute)");
  }

  return {
    rpcUrl,
    mint,
    feeAuthorityKeypair,
    lpVaultKeypair,
    rewardsVaultKeypair,
    lpShare,
    snapshotIntervalMs,
    excludedOwners,
    minEligibleBalance,
    pumpFunProgramId,
    raydiumPoolId: process.env.RAYDIUM_POOL_ID || null,
    live: process.env.LIVE === "true",
    dataDir: optionalEnv("DATA_DIR", "./data"),
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
    apiPort: Number(optionalEnv("PORT", optionalEnv("API_PORT", "4000"))),
  };
}
