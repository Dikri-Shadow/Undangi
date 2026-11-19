create table if not exists public.weddings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 80),
  status text not null default 'draft' check (status in ('draft', 'published')),
  bride_name text not null check (char_length(bride_name) between 1 and 80),
  bride_full_name text not null check (char_length(bride_full_name) between 1 and 160),
  groom_name text not null check (char_length(groom_name) between 1 and 80),
  groom_full_name text not null check (char_length(groom_full_name) between 1 and 160),
  wedding_data jsonb not null,
  theme text not null default 'luxury-burgundy',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by text,
  deleted_at timestamptz
);

create index if not exists weddings_public_slug_idx on public.weddings (slug) where status = 'published' and deleted_at is null;
create index if not exists weddings_updated_idx on public.weddings (updated_at desc) where deleted_at is null;

alter table public.weddings enable row level security;
revoke all on public.weddings from anon, authenticated;
grant select (slug, status, wedding_data, theme, updated_at, published_at, deleted_at) on public.weddings to anon, authenticated;

drop policy if exists "published weddings are public" on public.weddings;
create policy "published weddings are public" on public.weddings for select to anon, authenticated using (status = 'published' and deleted_at is null);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wedding-media', 'wedding-media', true, 8388608, array['image/jpeg','image/png','image/webp','image/avif','audio/mpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public can read wedding media" on storage.objects;
create policy "public can read wedding media" on storage.objects for select to public using (bucket_id = 'wedding-media');

-- Upload/update/delete sengaja tidak memiliki policy client. Operasi media hanya
-- dilakukan oleh server tervalidasi menggunakan service-role.
