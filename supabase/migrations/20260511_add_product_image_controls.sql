alter table public.products
  add column if not exists image_fit text not null default 'contain',
  add column if not exists image_position text not null default 'center center',
  add column if not exists image_zoom numeric(6,2) not null default 1;
