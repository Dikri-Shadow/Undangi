-- Additive shared rate-limit storage for public/customer endpoints.
-- Apply only to an explicitly verified local Supabase target first.
create table if not exists public.shared_rate_limits (
  key_hash text primary key check (char_length(key_hash) = 64),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.shared_rate_limits enable row level security;
revoke all on public.shared_rate_limits from anon, authenticated;

create or replace function public.consume_shared_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_allowed boolean;
begin
  if p_key_hash is null or char_length(p_key_hash) <> 64
     or p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.shared_rate_limits(key_hash, window_started_at, request_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update set
    request_count = case
      when shared_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
        then 1
      else shared_rate_limits.request_count + 1
    end,
    window_started_at = case
      when shared_rate_limits.window_started_at < now() - make_interval(secs => p_window_seconds)
        then now()
      else shared_rate_limits.window_started_at
    end,
    updated_at = now();

  select request_count <= p_limit into v_allowed
  from public.shared_rate_limits
  where key_hash = p_key_hash;
  return coalesce(v_allowed, false);
end;
$$;

revoke all on function public.consume_shared_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_shared_rate_limit(text, integer, integer) to service_role;
