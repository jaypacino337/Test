import { test } from "node:test";
import assert from "node:assert/strict";
import { Connection, Keypair, SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { harvestPumpFunCreatorFees } from "../src/harvestPumpFunCreatorFees";

/** Fake RPC: the bonding vault holds `vault` lamports; a confirmed claim moves `claim` lamports to the creator. */
function fakeConn(vault: number, claim: number) {
  let creatorBalance = 1_000_000_000;
  let creatorKey = "";
  const sent: VersionedTransaction[] = [];
  const conn = {
    async getBalance(key: { toBase58(): string }) {
      return key.toBase58() === creatorKey ? creatorBalance : vault;
    },
    async getMinimumBalanceForRentExemption() {
      return 890_880;
    },
    async getTokenAccountBalance() {
      throw new Error("no PumpSwap vault");
    },
    async getLatestBlockhash() {
      return { blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 };
    },
    async sendTransaction(tx: VersionedTransaction) {
      sent.push(tx);
      creatorBalance += claim;
      return "sig";
    },
    async confirmTransaction() {
      return { context: { slot: 1 }, value: { err: null } };
    },
  };
  return { conn: conn as unknown as Connection, sent, setCreator: (k: string) => (creatorKey = k) };
}

function unsignedTx(payer: Keypair) {
  const msg = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: Keypair.generate().publicKey.toBase58(),
    instructions: [SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: Keypair.generate().publicKey, lamports: 1 })],
  }).compileToV0Message();
  return new VersionedTransaction(msg).serialize();
}

test("dry run reports claimable fees and never calls PumpPortal", async () => {
  const creator = Keypair.generate();
  const f = fakeConn(2_000_000_000, 0);
  f.setCreator(creator.publicKey.toBase58());
  let called = false;
  const res = await harvestPumpFunCreatorFees(f.conn, creator, {
    send: false,
    fetchImpl: (async () => {
      called = true;
      return new Response("");
    }) as typeof fetch,
  });
  assert.deepEqual(res, []);
  assert.equal(called, false);
});

test("live claim posts collectCreatorFee, signs locally, reports the NET amount that landed", async () => {
  const creator = Keypair.generate();
  const f = fakeConn(2_000_000_000, 1_500_000_000);
  f.setCreator(creator.publicKey.toBase58());
  let body: Record<string, unknown> = {};
  const res = await harvestPumpFunCreatorFees(f.conn, creator, {
    send: true,
    fetchImpl: (async (_url: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(unsignedTx(creator), { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal(body.action, "collectCreatorFee");
  assert.equal(body.pool, "pump");
  assert.equal(body.publicKey, creator.publicKey.toBase58());
  assert.equal(res[0].lamportsHarvested, "1500000000");
  assert.equal(f.sent.length, 1);
});

test("refuses to sign a PumpPortal tx paid by someone else", async () => {
  const creator = Keypair.generate();
  const f = fakeConn(2_000_000_000, 0);
  f.setCreator(creator.publicKey.toBase58());
  await assert.rejects(
    harvestPumpFunCreatorFees(f.conn, creator, {
      send: true,
      fetchImpl: (async () => new Response(unsignedTx(Keypair.generate()), { status: 200 })) as unknown as typeof fetch,
    }),
    /unexpected fee payer/
  );
  assert.equal(f.sent.length, 0);
});

test("nothing claimable: no PumpPortal call even when live", async () => {
  const creator = Keypair.generate();
  const f = fakeConn(0, 0);
  f.setCreator(creator.publicKey.toBase58());
  let called = false;
  const res = await harvestPumpFunCreatorFees(f.conn, creator, {
    send: true,
    fetchImpl: (async () => {
      called = true;
      return new Response("");
    }) as typeof fetch,
  });
  assert.deepEqual(res, []);
  assert.equal(called, false);
});
