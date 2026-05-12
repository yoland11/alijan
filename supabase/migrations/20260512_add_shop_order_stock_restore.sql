alter table public.shop_orders
  add column if not exists stock_restored boolean not null default false;
