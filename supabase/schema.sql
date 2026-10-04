-- Sherwood ($ARROW): run once in the Supabase SQL editor (or `supabase db push`).
--
-- One table of versioned JSON documents, written only by the bot:
--   stats:<mint>                 the stats the website shows (totals, last snapshot/cycle, 24h history)
--   plan:<mint8>:<snapshotId>    a frozen payout plan; every batch's signature is stored here
--                                BEFORE broadcast, which is what makes airdrops crash-safe
--
-- RLS is ON with NO policies: the anon/public key can't read or write anything.
-- The bot (Railway) and the site's server route (Vercel) use SUPABASE_SERVICE_ROLE_KEY,
-- which is server-only and never sent to the browser.

create table if not exists public.sherwood_docs (
  key         text primary key,
  doc         jsonb not null,
  version     integer not null default 0,   -- optimistic locking: every write is PATCH … WHERE version = <read>
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.sherwood_docs enable row level security;

create index if not exists sherwood_docs_updated_at on public.sherwood_docs (updated_at desc);
