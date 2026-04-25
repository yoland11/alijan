create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  name text not null,
  phone text not null,
  service_type text not null check (service_type in ('Album', 'Session', 'Koshat', 'Gifts', 'Research')),
  photographer text not null default ''::text,
  session_type text not null default ''::text,
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
  total_amount numeric(12,2) not null default 0,
  received_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_updated_at_idx on public.orders (updated_at desc);
create index if not exists orders_order_code_idx on public.orders (order_code);
create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.set_order_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.total_amount = coalesce(new.total_amount, 0);
  new.received_amount = coalesce(new.received_amount, 0);
  new.remaining_amount = greatest(new.total_amount - new.received_amount, 0);
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_orders_updated_at on public.orders;
drop trigger if exists set_orders_derived_fields on public.orders;

create trigger set_orders_derived_fields
before insert or update on public.orders
for each row
execute function public.set_order_derived_fields();

alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('order-media', 'order-media', true)
on conflict (id) do nothing;

comment on table public.orders is 'AJN orders table for bookings and order tracking.';
