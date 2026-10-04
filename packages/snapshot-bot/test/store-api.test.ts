import { test } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { AddressInfo } from "net";
import { Keypair } from "@solana/web3.js";
import { fileStore, supabaseStore } from "@sherwood/shared";
import type { SherwoodStats, StatsResponse } from "@sherwood/shared";
import { createApi } from "../src/api";
import { emptyStats, statsKey } from "../src/stats";

/** In-memory PostgREST look-alike for `sherwood_docs` (select / insert-ignore / conditional patch). */
function fakeSupabase() {
  const rows = new Map<string, { doc: unknown; version: number }>();
  const fetchImpl = (async (input: string | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const key = decodeURIComponent((url.searchParams.get("key") ?? "").replace(/^eq\./, ""));
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
    await new Promise((r) => setTimeout(r, Math.random() * 3)); // interleave concurrent writers
    if (init?.headers && (init.headers as Record<string, string>).apikey !== "service") return reply({ message: "bad key" }, 401);
    if (!init?.method || init.method === "GET") {
      const r = rows.get(key);
      return reply(r ? [{ doc: structuredClone(r.doc), version: r.version }] : []);
    }
    const body = JSON.parse(String(init.body));
    if (init.method === "POST") {
      if (rows.has(body.key)) return reply([], 201);
      rows.set(body.key, { doc: body.doc, version: body.version });
      return reply([body], 201);
    }
    if (init.method === "PATCH") {
      const want = Number((url.searchParams.get("version") ?? "").replace(/^eq\./, ""));
      const r = rows.get(key);
      if (!r || r.version !== want) return reply([]);
      rows.set(key, { doc: body.doc, version: body.version });
      return reply([{ key }]);
    }
    return reply({ message: "unsupported" }, 400);
  }) as typeof fetch;
  return { rows, fetchImpl };
}

test("file store: read-modify-write with versions", async () => {
  const store = fileStore(fs.mkdtempSync(path.join(os.tmpdir(), "sherwood-store-")));
  assert.equal(await store.get("stats:x"), null);
  await store.update<{ n: number }>("stats:x", (c) => ({ n: (c?.n ?? 0) + 1 }));
  await store.update<{ n: number }>("stats:x", (c) => ({ n: (c?.n ?? 0) + 1 }));
  assert.deepEqual(await store.get("stats:x"), { n: 2 });
  await assert.rejects(store.update("../escape", () => ({})), /bad store key/);
});

test("supabase store: 25 concurrent increments lose no writes", async () => {
  const fake = fakeSupabase();
  const store = supabaseStore("https://example.supabase.co", "service", fake.fetchImpl);
  await Promise.all(Array.from({ length: 25 }, () => store.update<{ n: number }>("stats:race", (c) => ({ n: (c?.n ?? 0) + 1 }))));
  assert.deepEqual(await store.get("stats:race"), { n: 25 });
  assert.equal(fake.rows.get("stats:race")!.version, 24);
});

test("supabase store: a wrong key is refused", async () => {
  const fake = fakeSupabase();
  const store = supabaseStore("https://example.supabase.co", "anon", fake.fetchImpl);
  await assert.rejects(store.get("stats:x"), /401/);
});

test("stats API: nulls (not zeros) before the first live cycle, real numbers after", async () => {
  const store = fileStore(fs.mkdtempSync(path.join(os.tmpdir(), "sherwood-api-")));
  const mint = Keypair.generate().publicKey;
  const server = createApi(store, { mint, snapshotIntervalMs: 900_000, live: false }).listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const before = (await (await fetch(`${base}/api/stats`)).json()) as StatsResponse;
    assert.equal(before.mint, mint.toBase58());
    assert.equal(before.totalDistributedLamports, null);
    assert.equal(before.totalHarvestedLamports, null);
    assert.equal(before.holderCount, null);
    assert.equal(before.nextSnapshotAt, null);

    await store.update<SherwoodStats>(statsKey(mint.toBase58()), () => {
      const s = emptyStats(mint.toBase58(), 900_000, true);
      s.totalDistributedLamports = "1500000000";
      s.lastSnapshot = { id: "1", takenAt: "2026-10-04T12:00:00.000Z", holderCount: 42, totalEligibleSupply: "1", rewardsPoolLamports: "0" };
      s.lastCycle = { startedAt: "2026-10-04T12:00:00.000Z", finishedAt: "2026-10-04T12:00:05.000Z", live: true, ok: true, harvestedLamports: "0", lpDepositedLamports: null, holderCount: 42, paidHolders: 0, failedHolders: 0 };
      return s;
    });
    const after = (await (await fetch(`${base}/api/stats`)).json()) as StatsResponse;
    assert.equal(after.holderCount, 42);
    assert.equal(after.totalDistributedLamports, "1500000000");
    assert.equal(after.nextSnapshotAt, "2026-10-04T12:15:00.000Z");
    const health = (await (await fetch(`${base}/healthz`)).json()) as { ok: boolean };
    assert.equal(health.ok, true);
  } finally {
    server.close();
  }
});
