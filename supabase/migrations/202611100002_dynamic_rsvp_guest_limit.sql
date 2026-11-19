-- Per-invitation RSVP limits are stored in wedding_data.rsvp.maxGuests.
-- Legacy records without the setting use 4 through the trigger fallback.
alter table public.wedding_rsvp drop constraint if exists wedding_rsvp_guest_count_check;

create or replace function public.validate_wedding_rsvp_guest_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  configured_limit integer;
begin
  select coalesce(nullif((wedding_data->'rsvp'->>'maxGuests'), '')::integer, 4)
    into configured_limit
    from public.weddings
   where slug = new.wedding_slug;

  if configured_limit is null then
    configured_limit := 4;
  end if;

  if new.guest_count < 1 or new.guest_count > configured_limit then
    raise exception 'guest_count exceeds wedding RSVP limit';
  end if;
  return new;
end;
$$;

drop trigger if exists wedding_rsvp_guest_limit_trigger on public.wedding_rsvp;
create trigger wedding_rsvp_guest_limit_trigger
before insert or update of wedding_slug, guest_count on public.wedding_rsvp
for each row execute function public.validate_wedding_rsvp_guest_count();

revoke all on function public.validate_wedding_rsvp_guest_count() from public, anon, authenticated;
grant execute on function public.validate_wedding_rsvp_guest_count() to service_role;
