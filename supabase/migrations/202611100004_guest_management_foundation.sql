-- Guest Management foundation. Local-only rollout for initial verification.

create table if not exists public.wedding_guest_access (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null,
  token_hash text not null,
  token_version integer not null default 1 check (token_version > 0),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_by uuid
);

alter table public.wedding_guest_access
  drop constraint if exists wedding_guest_access_wedding_slug_fkey;
alter table public.wedding_guest_access
  add constraint wedding_guest_access_wedding_slug_fkey
  foreign key (wedding_slug) references public.weddings(slug);

create unique index if not exists wedding_guest_access_active_slug_uidx
  on public.wedding_guest_access (wedding_slug)
  where revoked_at is null;
create unique index if not exists wedding_guest_access_token_hash_uidx
  on public.wedding_guest_access (token_hash);
create index if not exists wedding_guest_access_slug_idx
  on public.wedding_guest_access (wedding_slug);

create table if not exists public.wedding_recipients (
  id uuid primary key default gen_random_uuid(),
  wedding_slug text not null,
  guest_name text not null check (char_length(guest_name) between 1 and 120),
  personal_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.wedding_recipients
  drop constraint if exists wedding_recipients_wedding_slug_fkey;
alter table public.wedding_recipients
  add constraint wedding_recipients_wedding_slug_fkey
  foreign key (wedding_slug) references public.weddings(slug);
alter table public.wedding_recipients
  add constraint wedding_recipients_slug_id_uidx unique (wedding_slug, id);

create unique index if not exists wedding_recipients_personal_token_hash_uidx
  on public.wedding_recipients (personal_token_hash);
create index if not exists wedding_recipients_active_slug_idx
  on public.wedding_recipients (wedding_slug)
  where deleted_at is null;

alter table public.wedding_rsvp add column if not exists recipient_id uuid;
alter table public.wedding_rsvp
  drop constraint if exists wedding_rsvp_recipient_slug_fkey;
alter table public.wedding_rsvp
  add constraint wedding_rsvp_recipient_slug_fkey
  foreign key (wedding_slug, recipient_id)
  references public.wedding_recipients (wedding_slug, id);

create unique index if not exists wedding_rsvp_recipient_uidx
  on public.wedding_rsvp (recipient_id)
  where recipient_id is not null;

create index if not exists wedding_rsvp_recipient_idx
  on public.wedding_rsvp (wedding_slug, recipient_id);

alter table public.wedding_guest_access enable row level security;
alter table public.wedding_recipients enable row level security;

revoke all on public.wedding_guest_access from anon, authenticated;
revoke all on public.wedding_recipients from anon, authenticated;

