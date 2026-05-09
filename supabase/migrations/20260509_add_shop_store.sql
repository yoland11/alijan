create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.service_categories(id) on delete cascade,
  image_url text not null default ''::text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.service_categories(id) on delete cascade,
  name text not null,
  description text not null default ''::text,
  price numeric(12,2) not null default 0,
  image_url text not null default ''::text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  driver_notes text not null default ''::text,
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  google_maps_url text not null default ''::text,
  payment_method text not null check (payment_method in ('cash', 'mastercard')),
  wrapping_enabled boolean not null default false,
  wrapping_price numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null check (status in ('طلب جديد', 'قيد التجهيز', 'جاهز للتوصيل', 'تم التسليم', 'ملغي')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text not null default ''::text,
  quantity integer not null default 1,
  price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  mastercard_qr_url text not null default ''::text,
  wrapping_price numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  delivery_time_text text not null default '40 - 50 دقائق'::text,
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists service_categories_parent_idx on public.service_categories (parent_id);
create index if not exists service_categories_active_sort_idx on public.service_categories (is_active, sort_order);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_sort_idx on public.products (is_active, sort_order);
create index if not exists shop_orders_status_idx on public.shop_orders (status);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);
create index if not exists shop_order_items_order_id_idx on public.shop_order_items (order_id);

alter table public.products
  add column if not exists description text not null default ''::text;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_service_categories_updated_at on public.service_categories;
create trigger set_service_categories_updated_at
before update on public.service_categories
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_shop_orders_updated_at on public.shop_orders;
create trigger set_shop_orders_updated_at
before update on public.shop_orders
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_settings_updated_at on public.settings;
create trigger set_settings_updated_at
before update on public.settings
for each row
execute function public.set_row_updated_at();

insert into public.settings (mastercard_qr_url, wrapping_price, delivery_fee, delivery_time_text)
select ''::text, 0, 0, '40 - 50 دقائق'::text
where not exists (select 1 from public.settings);

insert into public.service_categories (name, slug, parent_id, image_url, is_active, sort_order)
values
  ('تجهيزات', 'تجهيزات', null, '', true, 1),
  ('ورود طبيعية', 'ورود-طبيعية', null, '', true, 2),
  ('هدايا', 'هدايا-متجر', null, '', true, 3),
  ('كوزمتك', 'كوزمتك', null, '', true, 4)
on conflict (slug) do nothing;

insert into public.service_categories (name, slug, parent_id, image_url, is_active, sort_order)
select values_list.name, values_list.slug, parent.id, '', true, values_list.sort_order
from (
  values
    ('تجهيزات', 'تجهيزات-الخطوبة', 'تجهيزات الخطوبة', 1),
    ('تجهيزات', 'تجهيزات-حنة', 'تجهيزات حنة', 2),
    ('تجهيزات', 'تجهيزات-عزوبية', 'تجهيزات عزوبية', 3),
    ('تجهيزات', 'تجهيزات-أعياد-ميلاد', 'تجهيزات أعياد ميلاد', 4),
    ('تجهيزات', 'تجهيزات-حج-والعمرة', 'تجهيزات حج والعمرة', 5),
    ('تجهيزات', 'تجهيزات-التخرج', 'تجهيزات التخرج', 6),
    ('تجهيزات', 'dj', 'DJ', 7),
    ('تجهيزات', 'كارت-دعوة', 'كارت دعوة', 8),
    ('ورود-طبيعية', 'باقات-طبيعية', 'باقات طبيعية', 1),
    ('ورود-طبيعية', 'باقات-غير-طبيعية', 'باقات غير طبيعية', 2),
    ('هدايا-متجر', 'رجالي', 'رجالي', 1),
    ('هدايا-متجر', 'نسائي', 'نسائي', 2),
    ('هدايا-متجر', 'ساعات', 'ساعات', 3),
    ('كوزمتك', 'عطور', 'عطور', 1),
    ('كوزمتك', 'مكياج', 'مكياج', 2)
) as values_list(parent_slug, slug, name, sort_order)
join public.service_categories parent on parent.slug = values_list.parent_slug
on conflict (slug) do nothing;
