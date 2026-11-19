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

  if not found then
    raise exception 'wedding slug does not exist';
  end if;
  if configured_limit is null then configured_limit := 4; end if;
  if new.guest_count < 1 or new.guest_count > configured_limit then
    raise exception 'guest_count exceeds wedding RSVP limit';
  end if;
  return new;
end;
$$;
