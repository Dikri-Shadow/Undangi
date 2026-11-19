create table if not exists public.catalog_themes (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120), description text, preview_image text,
  design_config jsonb not null default '{}'::jsonb, display_order integer not null default 0, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.catalog_packages (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120), description text, display_order integer not null default 0,
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.catalog_features (
  id uuid primary key default gen_random_uuid(), code text not null unique check (code ~ '^[a-z0-9_]+$'),
  name text not null check (char_length(name) between 1 and 120), value_type text not null check (value_type in ('boolean','integer')),
  active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.package_features (
  package_id uuid not null references public.catalog_packages(id) on delete cascade,
  feature_id uuid not null references public.catalog_features(id) on delete cascade,
  enabled boolean not null default true, numeric_limit integer,
  primary key (package_id, feature_id), check (numeric_limit is null or numeric_limit >= 0)
);
create table if not exists public.theme_package_prices (
  theme_id uuid not null references public.catalog_themes(id) on delete restrict,
  package_id uuid not null references public.catalog_packages(id) on delete restrict,
  normal_amount bigint not null check (normal_amount > 0), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (theme_id, package_id)
);
create table if not exists public.catalog_discounts (
  id uuid primary key default gen_random_uuid(), code text unique, name text not null check (char_length(name) between 1 and 120),
  discount_type text not null check (discount_type in ('percentage','fixed')), discount_value bigint not null check (discount_value > 0),
  starts_at timestamptz not null, ends_at timestamptz, active boolean not null default true,
  usage_limit integer check (usage_limit is null or usage_limit > 0), redemption_count integer not null default 0 check (redemption_count >= 0),
  minimum_amount bigint not null default 0 check (minimum_amount >= 0), target_theme_ids uuid[] not null default '{}', target_package_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at), check (discount_type <> 'percentage' or discount_value <= 100)
);
alter table public.orders add column if not exists catalog_snapshot jsonb;
alter table public.orders add column if not exists pricing_calculated_at timestamptz;
create index if not exists catalog_themes_active_order_idx on public.catalog_themes (active, display_order);
create index if not exists catalog_packages_active_order_idx on public.catalog_packages (active, display_order);
create index if not exists catalog_discounts_active_dates_idx on public.catalog_discounts (active, starts_at, ends_at);
alter table public.catalog_themes enable row level security;
alter table public.catalog_packages enable row level security;
alter table public.catalog_features enable row level security;
alter table public.package_features enable row level security;
alter table public.theme_package_prices enable row level security;
alter table public.catalog_discounts enable row level security;
revoke all on public.catalog_themes, public.catalog_packages, public.catalog_features, public.package_features, public.theme_package_prices, public.catalog_discounts from anon, authenticated;
grant select on public.catalog_themes, public.catalog_packages, public.catalog_features, public.package_features, public.theme_package_prices to service_role;
grant select, insert, update on public.catalog_themes, public.catalog_packages, public.catalog_features, public.package_features, public.theme_package_prices, public.catalog_discounts to service_role;
