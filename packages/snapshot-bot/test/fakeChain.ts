import { Keypair, Transaction, SystemInstruction } from "@solana/web3.js";
import { base58Encode } from "@sherwood/shared";
import type { PayoutConnection } from "../src/distribute";

export type SendMode = "ok" | "land-then-timeout" | "drop" | "fail-onchain";

/**
 * Minimal in-memory chain for the payout engine: tracks block height, which
 * signatures landed, and how many lamports each owner actually received.
 */
export class FakeChain {
  height = 1_000;
  landed = new Map<string, { err: unknown }>();
  paid = new Map<string, bigint>();
  sends = 0;
  modes: SendMode[] = [];
  existing = new Set<string>();

  private land(tx: Transaction, sig: string, err: unknown = null) {
    this.landed.set(sig, { err });
    if (err) return;
    for (const ix of tx.instructions) {
      const t = SystemInstruction.decodeTransfer(ix);
      const to = t.toPubkey.toBase58();
      this.paid.set(to, (this.paid.get(to) ?? 0n) + BigInt(t.lamports));
    }
  }

  conn(): PayoutConnection {
    const self = this;
    return {
      async getLatestBlockhash() {
        return { blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: self.height + 150 };
      },
      async sendRawTransaction(raw: Buffer | Uint8Array | number[]) {
        self.sends++;
        const tx = Transaction.from(Buffer.from(raw as Uint8Array));
        const sig = base58Encode(tx.signature!);
        const mode = self.modes.shift() ?? "ok";
        if (mode === "drop") throw new Error("node is behind (simulated drop)");
        if (mode === "fail-onchain") {
          self.land(tx, sig, { InstructionError: [0, "Custom"] });
          return sig;
        }
        self.land(tx, sig);
        if (mode === "land-then-timeout") throw new Error("block height exceeded (simulated timeout after landing)");
        return sig;
      },
      async confirmTransaction(strategy: unknown) {
        const sig = (strategy as { signature: string }).signature;
        const l = self.landed.get(sig);
        if (!l) throw new Error("not confirmed");
        return { context: { slot: 1 }, value: { err: l.err } };
      },
      async getSignatureStatuses(sigs: string[]) {
        return {
          context: { slot: 1 },
          value: sigs.map((s) => {
            const l = self.landed.get(s);
            return l ? { slot: 1, confirmations: null, err: l.err, confirmationStatus: "confirmed" as const } : null;
          }),
        };
      },
      async getBlockHeight() {
        return self.height;
      },
      async getMultipleAccountsInfo(keys: { toBase58(): string }[]) {
        return keys.map((k) => (self.existing.has(k.toBase58()) ? ({} as never) : null));
      },
      async getMinimumBalanceForRentExemption() {
        return 890_880;
      },
    } as unknown as PayoutConnection;
  }
}
