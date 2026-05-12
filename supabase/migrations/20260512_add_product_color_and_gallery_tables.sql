create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_name text not null default ''::text,
  color_hex text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_gallery_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  thumbnail_url text not null default ''::text,
  alt_text text not null default ''::text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
