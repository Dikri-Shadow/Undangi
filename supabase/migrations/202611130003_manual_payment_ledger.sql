alter table public.orders add column if not exists total_amount bigint;
alter table public.orders add column if not exists currency text not null default 'IDR';
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_total_amount_positive check (total_amount is null or total_amount > 0);
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('unpaid','partially_paid','proof_submitted','verified','rejected','paid'));

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  amount bigint not null check (amount > 0),
  payment_method text not null check (char_length(payment_method) between 1 and 80),
  payment_date date not null,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','rejected')),
  verified_at timestamptz,
  verified_by text,
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_transactions_order_idx on public.payment_transactions(order_id, payment_date desc);
create index if not exists payment_transactions_verified_idx on public.payment_transactions(verification_status, payment_date desc);
alter table public.payment_transactions enable row level security;
revoke all on public.payment_transactions from anon, authenticated;
grant select, insert, update on public.payment_transactions to service_role;

create or replace function public.verify_payment_transaction(p_transaction_id uuid, p_verified_by text)
returns public.payment_transactions
language plpgsql security definer set search_path = public
as $$
declare tx public.payment_transactions; current_total bigint; order_total bigint;
begin
  select * into tx from public.payment_transactions where id = p_transaction_id for update;
  if tx.id is null then raise exception using errcode = 'P0002', message = 'payment not found'; end if;
  if tx.verification_status = 'verified' then return tx; end if;
  select total_amount into order_total from public.orders where id = tx.order_id for update;
  if order_total is null or order_total <= 0 then raise exception using errcode = 'P0003', message = 'order price is not set'; end if;
  select coalesce(sum(amount),0) into current_total from public.payment_transactions where order_id = tx.order_id and verification_status = 'verified';
  if current_total + tx.amount > order_total then raise exception using errcode = 'P0004', message = 'payment exceeds order balance'; end if;
  update public.payment_transactions set verification_status='verified', verified_at=now(), verified_by=p_verified_by, updated_at=now() where id=tx.id returning * into tx;
  update public.orders set payment_status = case when current_total + tx.amount >= order_total then 'paid' else 'partially_paid' end, updated_at=now() where id=tx.order_id;
  return tx;
end $$;
revoke execute on function public.verify_payment_transaction(uuid,text) from public, anon, authenticated;
grant execute on function public.verify_payment_transaction(uuid,text) to service_role;
