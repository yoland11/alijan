alter table public.shop_orders
  add column if not exists order_code text,
  add column if not exists phone_last4 text,
  add column if not exists printed_at timestamptz,
  add column if not exists print_status text not null default 'pending',
  add column if not exists print_attempts integer not null default 0;

alter table public.shop_orders
  drop constraint if exists shop_orders_print_status_check;

alter table public.shop_orders
  add constraint shop_orders_print_status_check
  check (print_status in ('pending', 'printed', 'failed'));

create unique index if not exists shop_orders_order_code_unique
on public.shop_orders(order_code);
