-- Personal owner tokens for customer access (replaces the legacy wedding-wide
-- token in wedding_guest_access, one token covering every recipient).
-- DO NOT APPLY to live Supabase until Zeke approves the legacy-token
-- migration; the code paths using this table fail open to legacy until then.

create table if not exists public.wedding_customer_access (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null,
  label text not null default 'owner',
  token_hash text unique not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table public.wedding_customer_access
  drop constraint if exists wedding_customer_access_wedding_slug_fkey;
alter table public.wedding_customer_access
  add constraint wedding_customer_access_wedding_slug_fkey
  foreign key (wedding_slug) references public.weddings(slug);

create index if not exists wedding_customer_access_slug_idx
  on public.wedding_customer_access (wedding_slug);
create index if not exists wedding_customer_access_active_slug_idx
  on public.wedding_customer_access (wedding_slug)
  where revoked_at is null;

alter table public.wedding_customer_access enable row level security;

revoke all on public.wedding_customer_access from anon, authenticated;
