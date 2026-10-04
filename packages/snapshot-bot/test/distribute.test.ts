import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Keypair } from "@solana/web3.js";
import { fileStore } from "@sherwood/shared";
import type { HolderBalance, PayoutPlan } from "@sherwood/shared";
import { computePayouts, dropUnfundable, executePlan, makePlan } from "../src/distribute";
import { FakeChain } from "./fakeChain";

const tmpStore = () => fileStore(fs.mkdtempSync(path.join(os.tmpdir(), "sherwood-test-")));
const owners = (n: number) => Array.from({ length: n }, () => Keypair.generate().publicKey.toBase58());

async function setup(n: number, amount = 2_000_000n) {
  const store = tmpStore();
  const chain = new FakeChain();
  const vault = Keypair.generate();
  const people = owners(n);
  const plan = makePlan("plan:test:1", "1", amount * BigInt(n), people.map((owner) => ({ owner, amountLamports: amount })), 10);
  await store.update<PayoutPlan>(plan.id, () => plan);
  return { store, chain, vault, people, amount, key: plan.id };
}

const paidOnce = (chain: FakeChain, people: string[], amount: bigint) => {
  for (const p of people) assert.equal(chain.paid.get(p), amount, `${p} paid exactly once`);
};

test("pro-rata payouts round down and never exceed the pot", () => {
  const holders: HolderBalance[] = [
    { owner: "a", tokenAccount: "x", amount: "1" },
    { owner: "b", tokenAccount: "x", amount: "1" },
    { owner: "c", tokenAccount: "x", amount: "1" },
  ];
  const payouts = computePayouts(holders, 1_000_000n);
  assert.equal(payouts.length, 3);
  assert.ok(payouts.reduce((s, p) => s + p.amountLamports, 0n) <= 1_000_000n);
  assert.deepEqual(computePayouts(holders, 0n), []);
});

test("payouts below rent-exemption to wallets that don't exist are dropped", async () => {
  const chain = new FakeChain();
  const [exists, missing, big] = owners(3);
  chain.existing.add(exists);
  const kept = await dropUnfundable(chain.conn(), [
    { owner: exists, amountLamports: 5_000n },
    { owner: missing, amountLamports: 5_000n },
    { owner: big, amountLamports: 2_000_000n },
  ]);
  assert.deepEqual(kept.map((p) => p.owner), [exists, big]);
});

test("happy path: every holder paid once, plan closes", async () => {
  const s = await setup(25);
  const r = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(r.plan.closed, true);
  assert.equal(r.newlySent.length, 3);
  paidOnce(s.chain, s.people, s.amount);
});

test("a batch that landed but timed out is NOT re-sent on retry", async () => {
  const s = await setup(20);
  s.chain.modes = ["land-then-timeout"];
  const first = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(first.plan.batches[0].status, "pending");
  assert.equal(first.plan.closed, false);

  // a fresh process (new call) resumes from the store
  const sendsBefore = s.chain.sends;
  const second = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(s.chain.sends, sendsBefore, "nothing re-broadcast");
  assert.equal(second.plan.closed, true);
  assert.equal(second.newlySent.length, 1);
  paidOnce(s.chain, s.people, s.amount);
});

test("a dropped batch waits while its blockhash is valid, then is re-signed once", async () => {
  const s = await setup(10);
  s.chain.modes = ["drop"];
  await executePlan(s.chain.conn(), s.vault, s.store, s.key);

  const sends = s.chain.sends;
  const stillValid = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(s.chain.sends, sends, "no resend while the old tx could still land");
  assert.equal(stillValid.plan.batches[0].status, "pending");

  s.chain.height += 200; // blockhash expired: the old tx can never land
  const after = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(after.plan.closed, true);
  assert.equal(after.plan.batches[0].attempts, 2);
  paidOnce(s.chain, s.people, s.amount);
});

test("an on-chain failure is retried with a new tx and gives up after 3 attempts", async () => {
  const s = await setup(10);
  s.chain.modes = ["fail-onchain", "fail-onchain", "fail-onchain"];
  let r = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(r.plan.batches[0].status, "failed");
  r = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  r = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(r.plan.batches[0].attempts, 3);
  assert.equal(r.plan.closed, true);
  assert.equal(r.newlyFailed.length, 1);
  const sends = s.chain.sends;
  await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(s.chain.sends, sends, "closed plan sends nothing");
  for (const p of s.people) assert.equal(s.chain.paid.get(p), undefined);
});

test("re-running a finished plan sends nothing", async () => {
  const s = await setup(12);
  await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  const sends = s.chain.sends;
  const again = await executePlan(s.chain.conn(), s.vault, s.store, s.key);
  assert.equal(s.chain.sends, sends);
  assert.equal(again.newlySent.length, 0);
  paidOnce(s.chain, s.people, s.amount);
});
