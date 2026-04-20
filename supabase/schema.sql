create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  name text not null,
  phone text not null,
  service_type text not null check (service_type in ('Album', 'Session', 'Koshat', 'Gifts')),
  booking_date date not null,
  status text not null check (
    status in (
      'تم الحجز',
      'قيد التنفيذ',
      'جاري التجهيز',
      'جاري التصوير',
      'المونتاج',
      'مكتمل',
      'تم التسليم'
    )
  ),
  notes text default ''::text,
  images text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_updated_at_idx on public.orders (updated_at desc);
create index if not exists orders_order_code_idx on public.orders (order_code);
create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;

create trigger set_orders_updated_at
before update on public.orders
for each row
execute function public.set_updated_at();

alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('order-media', 'order-media', true)
on conflict (id) do nothing;

comment on table public.orders is 'AJN orders table for bookings and order tracking.';
