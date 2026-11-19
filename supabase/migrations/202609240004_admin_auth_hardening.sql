create table if not exists public.admin_auth_sessions (
  session_id uuid primary key,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.admin_login_limits (
  key_hash text primary key check (char_length(key_hash) = 64),
  failures integer not null default 0,
  window_started_at timestamptz not null default now(),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_recent_reauth (
  session_id uuid primary key references public.admin_auth_sessions(session_id) on delete cascade,
  verified_at timestamptz not null default now()
);

create table if not exists public.admin_security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('login_success','login_failed','login_rate_limited','mfa_challenge_failed','mfa_success','logout','logout_all','sensitive_reauth','wedding_delete','slug_change','publish','unpublish','security_change')),
  success boolean not null,
  session_id uuid,
  ip_hash text check (ip_hash is null or char_length(ip_hash) = 64),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 2048)
);

create index if not exists admin_security_events_created_idx on public.admin_security_events(created_at desc);
create index if not exists admin_auth_sessions_user_idx on public.admin_auth_sessions(auth_user_id, revoked_at);

alter table public.admin_auth_sessions enable row level security;
alter table public.admin_login_limits enable row level security;
alter table public.admin_recent_reauth enable row level security;
alter table public.admin_security_events enable row level security;
revoke all on public.admin_auth_sessions, public.admin_login_limits, public.admin_recent_reauth, public.admin_security_events from anon, authenticated;

create or replace function public.consume_admin_login_failure(p_key_hash text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.admin_login_limits(key_hash, failures, window_started_at, blocked_until, updated_at)
  values (p_key_hash, 1, now(), null, now())
  on conflict (key_hash) do update set
    failures = case when admin_login_limits.window_started_at < now() - interval '30 minutes' then 1 else admin_login_limits.failures + 1 end,
    window_started_at = case when admin_login_limits.window_started_at < now() - interval '30 minutes' then now() else admin_login_limits.window_started_at end,
    blocked_until = case
      when (case when admin_login_limits.window_started_at < now() - interval '30 minutes' then 1 else admin_login_limits.failures + 1 end) >= 10 then now() + interval '30 minutes'
      when (case when admin_login_limits.window_started_at < now() - interval '30 minutes' then 1 else admin_login_limits.failures + 1 end) >= 5 then now() + interval '5 minutes'
      else admin_login_limits.blocked_until end,
    updated_at = now()
  returning failures into n;
  return n;
end $$;

create or replace function public.admin_login_allowed(p_key_hash text) returns boolean
language sql security definer set search_path = public as $$
  select coalesce((select blocked_until is null or blocked_until <= now() from public.admin_login_limits where key_hash = p_key_hash), true)
$$;

revoke all on function public.consume_admin_login_failure(text) from public, anon, authenticated;
revoke all on function public.admin_login_allowed(text) from public, anon, authenticated;
grant execute on function public.consume_admin_login_failure(text) to service_role;
grant execute on function public.admin_login_allowed(text) to service_role;
