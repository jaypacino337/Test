import cors from "cors";
import express from "express";
import type { DocStore, SherwoodConfig, SherwoodStats } from "@sherwood/shared";
import { statsKey, toResponse } from "./stats";

/**
 * Read-only stats API. The website reads Supabase directly when it's
 * configured; this endpoint serves the same numbers from whichever store the
 * bot uses (it's the only way to read the file store on a Railway volume).
 */
export function createApi(store: DocStore, config: Pick<SherwoodConfig, "mint" | "snapshotIntervalMs" | "live">) {
  const mint = config.mint.toBase58();
  const app = express();
  app.disable("x-powered-by");
  app.use(cors());

  const load = () => store.get<SherwoodStats>(statsKey(mint));

  app.get("/api/stats", async (_req, res) => {
    try {
      res.json(toResponse(await load(), mint, config.snapshotIntervalMs, config.live));
    } catch (err) {
      res.status(503).json({ error: (err as Error).message.slice(0, 200) });
    }
  });

  app.get("/api/distributions/recent", async (req, res) => {
    try {
      const limit = Math.max(1, Math.min(200, Number(req.query.limit) || 50));
      res.json(((await load())?.recentDistributions ?? []).slice(0, limit));
    } catch (err) {
      res.status(503).json({ error: (err as Error).message.slice(0, 200) });
    }
  });

  app.get(["/healthz", "/health"], async (_req, res) => {
    const s = await load().catch(() => null);
    res.json({ ok: true, live: config.live, cycles: s?.cycles ?? 0, last: s?.lastCycle ?? null });
  });

  return app;
}

export function startApi(store: DocStore, config: SherwoodConfig) {
  const app = createApi(store, config);
  const server = app.listen(config.apiPort, () => {
    console.log(`[api] stats API listening on :${config.apiPort}`);
  });
  return server;
}
