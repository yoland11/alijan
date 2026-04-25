alter table public.orders
  add column if not exists session_type text not null default ''::text;

update public.orders
set session_type = ''
where session_type is null;
