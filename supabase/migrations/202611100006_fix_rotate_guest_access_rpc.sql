-- Qualify token_version in the rotation function to avoid output-column ambiguity.
create or replace function public.rotate_wedding_guest_access(
  p_wedding_slug text,
  p_token_hash text
)
returns table (
  id uuid,
  wedding_slug text,
  token_version integer,
  created_at timestamptz,
  is_active boolean
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_next_version integer;
  v_id uuid;
  v_created_at timestamptz;
begin
  if p_wedding_slug is null or btrim(p_wedding_slug) = '' then
    raise exception using errcode = '22023', message = 'wedding_slug wajib diisi';
  end if;
  if p_token_hash is null or btrim(p_token_hash) = '' then
    raise exception using errcode = '22023', message = 'token_hash wajib diisi';
  end if;

  perform 1 from public.weddings where slug = p_wedding_slug for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Undangan tidak ditemukan';
  end if;

  select coalesce(max(ga.token_version), 0) + 1
    into v_next_version
    from public.wedding_guest_access as ga
   where ga.wedding_slug = p_wedding_slug;

  update public.wedding_guest_access as ga
     set revoked_at = clock_timestamp()
   where ga.wedding_slug = p_wedding_slug
     and ga.revoked_at is null;

  insert into public.wedding_guest_access (wedding_slug, token_hash, token_version)
  values (p_wedding_slug, p_token_hash, v_next_version)
  returning wedding_guest_access.id, wedding_guest_access.created_at into v_id, v_created_at;

  return query select v_id, p_wedding_slug, v_next_version, v_created_at, true;
end;
$function$;

revoke execute on function public.rotate_wedding_guest_access(text, text) from public, anon, authenticated;
grant execute on function public.rotate_wedding_guest_access(text, text) to service_role;
