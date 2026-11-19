create table if not exists public.app_admin (
  id uuid primary key default gen_random_uuid(),
  singleton_key smallint not null default 1 unique check (singleton_key = 1),
  auth_user_id uuid not null unique references auth.users(id) on delete restrict,
  email text not null check (char_length(email) between 3 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_bootstrap_tokens (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_bootstrap_tokens_active_idx
  on public.admin_bootstrap_tokens (expires_at)
  where used_at is null;

alter table public.app_admin enable row level security;
alter table public.admin_bootstrap_tokens enable row level security;
revoke all on public.app_admin from anon, authenticated;
revoke all on public.admin_bootstrap_tokens from anon, authenticated;

create or replace function public.claim_first_app_admin(
  p_auth_user_id uuid,
  p_email text,
  p_token_hash text
) returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  claimed_token uuid;
begin
  if exists (select 1 from public.app_admin where singleton_key = 1) then
    return false;
  end if;

  update public.admin_bootstrap_tokens
     set used_at = now()
   where token_hash = p_token_hash
     and used_at is null
     and expires_at > now()
  returning id into claimed_token;

  if claimed_token is null then
    return false;
  end if;

  insert into public.app_admin (singleton_key, auth_user_id, email)
  values (1, p_auth_user_id, lower(trim(p_email)));
  return true;
exception
  when unique_violation then
    return false;
end;
$$;

revoke all on function public.claim_first_app_admin(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_first_app_admin(uuid, text, text) to service_role;
