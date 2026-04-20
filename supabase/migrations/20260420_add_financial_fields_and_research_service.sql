alter table public.orders
  add column if not exists total_amount numeric(12,2) not null default 0,
  add column if not exists received_amount numeric(12,2) not null default 0,
  add column if not exists remaining_amount numeric(12,2) not null default 0;

alter table public.orders drop constraint if exists orders_service_type_check;

alter table public.orders
  add constraint orders_service_type_check
  check (service_type in ('Album', 'Session', 'Koshat', 'Gifts', 'Research'));

drop trigger if exists set_orders_updated_at on public.orders;
drop trigger if exists set_orders_derived_fields on public.orders;
drop function if exists public.set_updated_at();

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

create trigger set_orders_derived_fields
before insert or update on public.orders
for each row
execute function public.set_order_derived_fields();

update public.orders
set
  total_amount = coalesce(total_amount, 0),
  received_amount = coalesce(received_amount, 0),
  remaining_amount = greatest(coalesce(total_amount, 0) - coalesce(received_amount, 0), 0);
