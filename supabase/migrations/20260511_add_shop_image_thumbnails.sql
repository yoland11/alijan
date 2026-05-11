alter table public.products
  add column if not exists thumbnail_url text not null default '';

alter table public.service_categories
  add column if not exists thumbnail_url text not null default '';
