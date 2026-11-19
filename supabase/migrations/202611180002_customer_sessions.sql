-- Per-device customer/recipient session registry for the device limit
-- (max 3 active sessions per subject, oldest evicted first).
-- DO NOT APPLY to live Supabase until Zeke approves; the enforcement code
-- fails open (warn + continue) while this table does not exist.

create table if not exists public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null,
  subject_type text not null check (subject_type in ('customer', 'recipient')),
  subject_id text not null,
  token_hash text not null,
  device_hash text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.customer_sessions
  drop constraint if exists customer_sessions_wedding_slug_fkey;
alter table public.customer_sessions
  add constraint customer_sessions_wedding_slug_fkey
  foreign key (wedding_slug) references public.weddings(slug);

create index if not exists customer_sessions_subject_idx
  on public.customer_sessions (wedding_slug, subject_type, subject_id);
create index if not exists customer_sessions_subject_seen_idx
  on public.customer_sessions (wedding_slug, subject_type, subject_id, last_seen_at);

alter table public.customer_sessions enable row level security;

revoke all on public.customer_sessions from anon, authenticated;
