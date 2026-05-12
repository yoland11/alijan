alter table public.products
  add column if not exists video_url text not null default ''::text,
  add column if not exists stock_quantity integer,
  add column if not exists customization_options jsonb not null default '{}'::jsonb;

alter table public.shop_orders
  add column if not exists province text not null default ''::text,
  add column if not exists district text not null default ''::text,
  add column if not exists delivery_type text not null default ''::text,
  add column if not exists delivery_eta text not null default ''::text;

alter table public.shop_order_items
  add column if not exists customization jsonb not null default '{}'::jsonb;

alter table public.settings
  add column if not exists delivery_regions jsonb not null default '[]'::jsonb;

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null default ''::text,
  rating integer not null default 5 check (rating between 1 and 5),
  comment text not null default ''::text,
  image_url text not null default ''::text,
  approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null default ''::text,
  category text not null default 'مناسبات'::text,
  media_type text not null default 'image'::text check (media_type in ('image', 'video')),
  media_url text not null default ''::text,
  thumbnail_url text not null default ''::text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists product_reviews_product_idx on public.product_reviews (product_id, approved, created_at desc);
create index if not exists portfolio_entries_active_sort_idx on public.portfolio_entries (is_active, sort_order);

drop trigger if exists set_product_reviews_updated_at on public.product_reviews;
create trigger set_product_reviews_updated_at
before update on public.product_reviews
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_portfolio_entries_updated_at on public.portfolio_entries;
create trigger set_portfolio_entries_updated_at
before update on public.portfolio_entries
for each row
execute function public.set_row_updated_at();
