alter table public.orders
  add column if not exists koshat_type text not null default ''::text;

update public.orders
set koshat_type = ''
where koshat_type is null;
