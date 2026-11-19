create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  customer_whatsapp text not null check (char_length(customer_whatsapp) between 8 and 32),
  customer_email text,
  package_code text not null check (char_length(package_code) between 1 and 80),
  wedding_date date,
  customer_notes text check (customer_notes is null or char_length(customer_notes) <= 2000),
  order_status text not null default 'new' check (order_status in ('new','in_progress','waiting_customer','completed','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','proof_submitted','verified','rejected')),
  wedding_id uuid references public.weddings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_created_idx on public.orders (order_status, created_at desc);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists orders_wedding_id_idx on public.orders (wedding_id);

alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select, insert, update on public.orders to service_role;
