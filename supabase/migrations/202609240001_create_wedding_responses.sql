create extension if not exists pgcrypto;

create table if not exists public.wedding_rsvp (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null check (char_length(wedding_slug) between 1 and 80),
  guest_name text not null check (char_length(guest_name) between 1 and 60),
  attendance text not null check (attendance in ('hadir', 'tidak')),
  guest_count smallint not null check (guest_count between 1 and 4),
  message text check (message is null or char_length(message) <= 240),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (wedding_slug, idempotency_key)
);

create table if not exists public.wedding_wishes (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null check (char_length(wedding_slug) between 1 and 80),
  guest_name text not null check (char_length(guest_name) between 1 and 60),
  message text not null check (char_length(message) between 1 and 280),
  approved boolean not null default true,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (wedding_slug, idempotency_key)
);

create index if not exists wedding_rsvp_slug_created_idx on public.wedding_rsvp (wedding_slug, created_at desc);
create index if not exists wedding_wishes_slug_created_idx on public.wedding_wishes (wedding_slug, created_at desc) where approved = true;

alter table public.wedding_rsvp enable row level security;
alter table public.wedding_wishes enable row level security;

revoke all on public.wedding_rsvp from anon, authenticated;
revoke all on public.wedding_wishes from anon, authenticated;

-- Tidak ada policy anon: seluruh write/read publik melewati API tervalidasi.
-- SUPABASE_SERVICE_ROLE_KEY hanya digunakan pada server dan tidak pernah dibundel ke client.
