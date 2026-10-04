import * as fs from "fs";
import * as path from "path";

/**
 * A tiny document store: one JSON document per key, every write guarded by a
 * `version` (optimistic locking), so two writers can never silently overwrite
 * each other. Backed by Supabase (table `sherwood_docs`, see supabase/schema.sql)
 * or, for local runs / a Railway volume, by JSON files on disk.
 */
export interface DocStore {
  readonly kind: "supabase" | "file";
  get<T>(key: string): Promise<T | null>;
  /** Read-modify-write. `fn` receives null when the doc doesn't exist yet. Retries on a lost race. */
  update<T>(key: string, fn: (current: T | null) => T): Promise<T>;
}

const MAX_RETRIES = 8;
const KEY_RE = /^[A-Za-z0-9:_.-]{1,200}$/;

function checkKey(key: string): string {
  if (!KEY_RE.test(key)) throw new Error(`bad store key: ${key}`);
  return key;
}

const backoff = (attempt: number) => new Promise((r) => setTimeout(r, 15 + Math.random() * 40 * (attempt + 1)));

// ── File backend ────────────────────────────────────────────────────────────

export function fileStore(dir: string): DocStore {
  fs.mkdirSync(dir, { recursive: true });
  const fileOf = (key: string) => path.join(dir, `${checkKey(key).replace(/:/g, "__")}.json`);
  const read = <T>(key: string): { doc: T; version: number } | null => {
    const f = fileOf(key);
    return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, "utf-8")) as { doc: T; version: number }) : null;
  };
  return {
    kind: "file",
    async get<T>(key: string) {
      return read<T>(key)?.doc ?? null;
    },
    async update<T>(key: string, fn: (current: T | null) => T) {
      const cur = read<T>(key);
      const doc = fn(cur ? cur.doc : null);
      const f = fileOf(key);
      const tmp = `${f}.${process.pid}.tmp`;
      // write-then-rename is atomic on POSIX: a crash leaves the old or the new doc, never half of one
      fs.writeFileSync(tmp, JSON.stringify({ doc, version: (cur?.version ?? -1) + 1 }));
      fs.renameSync(tmp, f);
      return doc;
    },
  };
}

// ── Supabase backend (PostgREST, no SDK) ────────────────────────────────────

export function supabaseStore(url: string, serviceKey: string, fetchImpl: typeof fetch = fetch): DocStore {
  const base = `${url.replace(/\/$/, "")}/rest/v1/sherwood_docs`;
  async function rest<T>(query: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
    const res = await fetchImpl(`${base}${query}`, {
      method: init.method ?? "GET",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        "content-type": "application/json",
        ...(init.prefer ? { prefer: init.prefer } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Supabase ${init.method ?? "GET"} → ${res.status}: ${text.slice(0, 200)}`);
    return (text ? JSON.parse(text) : null) as T;
  }
  const eq = (key: string) => `key=eq.${encodeURIComponent(checkKey(key))}`;

  return {
    kind: "supabase",
    async get<T>(key: string) {
      const rows = await rest<{ doc: T }[]>(`?select=doc&${eq(key)}`);
      return rows[0]?.doc ?? null;
    },
    async update<T>(key: string, fn: (current: T | null) => T) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const rows = await rest<{ doc: T; version: number }[]>(`?select=doc,version&${eq(key)}`);
        if (!rows[0]) {
          const doc = fn(null);
          const inserted = await rest<unknown[]>(`?on_conflict=key`, {
            method: "POST",
            prefer: "resolution=ignore-duplicates,return=representation",
            body: { key, doc, version: 0 },
          });
          if (inserted.length === 1) return doc;
        } else {
          const { doc: current, version } = rows[0];
          const doc = fn(current);
          const written = await rest<unknown[]>(`?${eq(key)}&version=eq.${version}`, {
            method: "PATCH",
            prefer: "return=representation",
            body: { doc, version: version + 1, updated_at: new Date().toISOString() },
          });
          if (written.length === 1) return doc;
        }
        await backoff(attempt); // someone else wrote first: re-read and retry
      }
      throw new Error(`store busy: too many concurrent writes to ${key}`);
    },
  };
}

export function storeFromConfig(cfg: { supabaseUrl: string | null; supabaseServiceKey: string | null; dataDir: string }): DocStore {
  if (cfg.supabaseUrl && cfg.supabaseServiceKey) return supabaseStore(cfg.supabaseUrl, cfg.supabaseServiceKey);
  return fileStore(path.join(cfg.dataDir, "store"));
}
