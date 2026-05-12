alter table public.products
  add column if not exists color_options jsonb not null default '[]'::jsonb,
  add column if not exists preview_images jsonb not null default '[]'::jsonb;

alter table public.shop_order_items
  add column if not exists selected_color_name text not null default '',
  add column if not exists selected_color_hex text not null default '';
