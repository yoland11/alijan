alter table public.orders
  add column if not exists photographer text not null default ''::text;

update public.orders
set photographer = ''
where photographer is null;
