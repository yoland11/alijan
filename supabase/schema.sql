create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null,
  name text not null,
  phone text not null,
  service_type text not null check (service_type in ('Album', 'Session', 'Koshat', 'Gifts', 'Research', 'Graduation')),
  photographer text not null default ''::text,
  session_type text not null default ''::text,
  koshat_type text not null default ''::text,
  research_details jsonb not null default '{"title":"","student_names":"","supervisor_name":"","academic_entity":"","delivery_date":"","print_enabled":false,"copy_count":0,"binding_type":""}'::jsonb,
  research_files jsonb not null default '[]'::jsonb,
  graduation_details jsonb not null default '{"package_type":"","sash_type":"","robe_type":"","writing_type":"","measurements":{"sash_length":"","shoulder":"","robe_length":"","hand":""},"has_cap":false}'::jsonb,
  booking_date date not null,
  status text not null check (
    status in (
      'تم الحجز',
      'قيد التنفيذ',
      'جاري التجهيز',
      'جاري التصوير',
      'المونتاج',
      'مكتمل',
      'تم التسليم',
      'تم استلام الحجز',
      'جاري إعداد وكتابة البحث',
      'قيد التدقيق والمراجعة',
      'اكتمال النسخة الأولية',
      'مراجعة المشرف العلمي',
      'تنفيذ التعديلات المطلوبة',
      'اكتمال البحث النهائي',
      'جاري المتابعة والتنسيق',
      'جاري الخياطة والتجهيز',
      'أثناء الطباعة والتغليف',
      'تم اكتمال الطلب'
    )
  ),
  notes text default ''::text,
  images text[] not null default '{}'::text[],
  total_amount numeric(12,2) not null default 0,
  received_amount numeric(12,2) not null default 0,
  remaining_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_updated_at_idx on public.orders (updated_at desc);
create index if not exists orders_order_code_idx on public.orders (order_code);
create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_status_idx on public.orders (status);

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

drop trigger if exists set_orders_updated_at on public.orders;
drop trigger if exists set_orders_derived_fields on public.orders;

create trigger set_orders_derived_fields
before insert or update on public.orders
for each row
execute function public.set_order_derived_fields();

alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('order-media', 'order-media', true)
on conflict (id) do nothing;

comment on table public.orders is 'AJN orders table for bookings and order tracking.';

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.service_categories(id) on delete cascade,
  image_url text not null default ''::text,
  thumbnail_url text not null default ''::text,
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
  thumbnail_url text not null default ''::text,
  image_fit text not null default 'contain'::text,
  image_position text not null default 'center center'::text,
  image_zoom numeric(6,2) not null default 1,
  color_options jsonb not null default '[]'::jsonb,
  preview_images jsonb not null default '[]'::jsonb,
  video_url text not null default ''::text,
  stock_quantity integer,
  customization_options jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

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

alter table public.products
  add column if not exists thumbnail_url text not null default '',
  add column if not exists image_fit text not null default 'contain',
  add column if not exists image_position text not null default 'center center',
  add column if not exists image_zoom numeric(6,2) not null default 1,
  add column if not exists color_options jsonb not null default '[]'::jsonb,
  add column if not exists preview_images jsonb not null default '[]'::jsonb,
  add column if not exists video_url text not null default '',
  add column if not exists stock_quantity integer,
  add column if not exists customization_options jsonb not null default '{}'::jsonb;

alter table public.service_categories
  add column if not exists thumbnail_url text not null default '';

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  order_code text,
  phone_last4 text,
  customer_name text not null,
  phone text not null,
  city text not null,
  province text not null default ''::text,
  district text not null default ''::text,
  address text not null,
  delivery_type text not null default ''::text,
  delivery_eta text not null default ''::text,
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
  stock_restored boolean not null default false,
  printed_at timestamptz,
  print_status text not null default 'pending' check (print_status in ('pending', 'printed', 'failed')),
  print_attempts integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.shop_orders
  add column if not exists order_code text,
  add column if not exists phone_last4 text,
  add column if not exists province text not null default '',
  add column if not exists district text not null default '',
  add column if not exists delivery_type text not null default '',
  add column if not exists delivery_eta text not null default '',
  add column if not exists stock_restored boolean not null default false,
  add column if not exists printed_at timestamptz,
  add column if not exists print_status text not null default 'pending',
  add column if not exists print_attempts integer not null default 0;

alter table public.shop_orders
  drop constraint if exists shop_orders_print_status_check;

alter table public.shop_orders
  add constraint shop_orders_print_status_check
  check (print_status in ('pending', 'printed', 'failed'));

create table if not exists public.shop_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text not null default ''::text,
  selected_color_name text not null default ''::text,
  selected_color_hex text not null default ''::text,
  customization jsonb not null default '{}'::jsonb,
  quantity integer not null default 1,
  price numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.shop_order_items
  add column if not exists selected_color_name text not null default '',
  add column if not exists selected_color_hex text not null default '',
  add column if not exists customization jsonb not null default '{}'::jsonb;

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  mastercard_qr_url text not null default ''::text,
  wrapping_price numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  delivery_time_text text not null default '40 - 50 دقائق'::text,
  delivery_regions jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

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

create index if not exists service_categories_parent_idx on public.service_categories (parent_id);
create index if not exists service_categories_active_sort_idx on public.service_categories (is_active, sort_order);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_sort_idx on public.products (is_active, sort_order);
create index if not exists product_reviews_product_idx on public.product_reviews (product_id, approved, created_at desc);
create index if not exists portfolio_entries_active_sort_idx on public.portfolio_entries (is_active, sort_order);
create index if not exists shop_orders_status_idx on public.shop_orders (status);
create index if not exists shop_orders_created_at_idx on public.shop_orders (created_at desc);
create index if not exists shop_order_items_order_id_idx on public.shop_order_items (order_id);
create unique index if not exists shop_orders_order_code_unique on public.shop_orders (order_code);

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

comment on table public.service_categories is 'AJN service categories for the shop.';
comment on table public.products is 'AJN store products.';
comment on table public.shop_orders is 'AJN store checkout orders.';
comment on table public.shop_order_items is 'Items belonging to AJN store orders.';
comment on table public.settings is 'AJN store payment and delivery settings.';
