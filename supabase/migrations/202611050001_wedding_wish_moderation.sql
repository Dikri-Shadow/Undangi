-- Local-only migration. Do not apply automatically to production.
alter table public.wedding_wishes
  add column if not exists moderation_status text not null default 'approved';

alter table public.wedding_wishes
  drop constraint if exists wedding_wishes_moderation_status_check;
alter table public.wedding_wishes
  add constraint wedding_wishes_moderation_status_check
  check (moderation_status in ('pending', 'approved', 'rejected'));

create index if not exists wedding_wishes_pending_idx
  on public.wedding_wishes (moderation_status, created_at desc)
  where moderation_status = 'pending';
create index if not exists wedding_wishes_slug_status_idx
  on public.wedding_wishes (wedding_slug, moderation_status, created_at desc);
