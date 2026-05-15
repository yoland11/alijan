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
  service_details jsonb not null default '{"province":"","address":"","booking_time":"","venue_type":"","chair_count":"","transport_required":false,"session_location":"","session_kind":"","people_count":"","video_required":false,"album_type":"","page_count":"","album_size":"","cover_type":"","cover_name":"","university":"","department":"","gift_type":"","recipient_name":"","occasion_date":"","gift_message":""}'::jsonb,
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
  customer_user_id uuid,
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
  status text not null check (status in ('طلب جديد', 'قيد التجهيز', 'جاهز للتوصيل', 'استلمت الطلب', 'بالطريق', 'تم التسليم', 'ملغي')),
  stock_restored boolean not null default false,
  assigned_driver_id uuid,
  assigned_driver_name text not null default ''::text,
  assigned_at timestamptz,
  printed_at timestamptz,
  print_status text not null default 'pending' check (print_status in ('pending', 'printed', 'failed')),
  print_attempts integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.shop_orders
  add column if not exists order_code text,
  add column if not exists phone_last4 text,
  add column if not exists customer_user_id uuid,
  add column if not exists province text not null default '',
  add column if not exists district text not null default '',
  add column if not exists delivery_type text not null default '',
  add column if not exists delivery_eta text not null default '',
  add column if not exists stock_restored boolean not null default false,
  add column if not exists assigned_driver_id uuid,
  add column if not exists assigned_driver_name text not null default '',
  add column if not exists assigned_at timestamptz,
  add column if not exists printed_at timestamptz,
  add column if not exists print_status text not null default 'pending',
  add column if not exists print_attempts integer not null default 0;

alter table public.shop_orders
  drop constraint if exists shop_orders_status_check;

alter table public.shop_orders
  add constraint shop_orders_status_check
  check (status in ('طلب جديد', 'قيد التجهيز', 'جاهز للتوصيل', 'استلمت الطلب', 'بالطريق', 'تم التسليم', 'ملغي'));

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

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default ''::text,
  unit text not null default 'قطعة'::text,
  quantity numeric(12,2) not null default 0,
  min_quantity numeric(12,2) not null default 0,
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  notes text not null default ''::text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  movement_type text not null check (movement_type in ('purchase', 'sale', 'adjustment', 'booking_use', 'restock')),
  quantity numeric(12,2) not null default 0,
  unit_cost numeric(12,2) not null default 0,
  note text not null default ''::text,
  related_order_id uuid references public.orders(id) on delete set null,
  related_shop_order_id uuid references public.shop_orders(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('sale_invoice', 'purchase_invoice', 'receipt_voucher', 'payment_voucher', 'expense', 'income')),
  reference_code text not null default ''::text,
  amount numeric(12,2) not null default 0,
  direction text not null check (direction in ('in', 'out')),
  source text not null default ''::text,
  customer_name text not null default ''::text,
  customer_phone text not null default ''::text,
  notes text not null default ''::text,
  happened_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employee_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null default ''::text,
  role text not null default ''::text,
  permissions text[] not null default '{}'::text[],
  monthly_salary numeric(12,2) not null default 0,
  notes text not null default ''::text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employee_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  attendance_date date not null,
  check_in_time text not null default ''::text,
  check_out_time text not null default ''::text,
  status text not null check (status in ('حاضر', 'متأخر', 'إجازة', 'غائب')),
  notes text not null default ''::text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.employee_tasks (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  title text not null,
  status text not null check (status in ('جديدة', 'قيد التنفيذ', 'مكتملة')) default 'جديدة',
  due_date date,
  notes text not null default ''::text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_items_updated_at_idx on public.inventory_items (updated_at desc);
create index if not exists inventory_items_active_idx on public.inventory_items (is_active, quantity);
create index if not exists inventory_movements_item_id_idx on public.inventory_movements (item_id, created_at desc);
create index if not exists cash_transactions_happened_at_idx on public.cash_transactions (happened_at desc);
create index if not exists employee_profiles_active_idx on public.employee_profiles (is_active, updated_at desc);
create index if not exists employee_attendance_employee_date_idx on public.employee_attendance (employee_id, attendance_date desc);
create index if not exists employee_tasks_employee_status_idx on public.employee_tasks (employee_id, status, due_date);

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

create table if not exists public.customer_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default ''::text,
  email text not null,
  phone text not null,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_users(id) on delete cascade,
  label text not null default ''::text,
  province text not null default ''::text,
  district text not null default ''::text,
  address text not null default ''::text,
  phone text not null default ''::text,
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  google_maps_url text not null default ''::text,
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  shop_order_id uuid references public.shop_orders(id) on delete set null,
  title text not null default ''::text,
  body text not null default ''::text,
  type text not null default 'general'::text,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_password_resets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_users(id) on delete cascade,
  token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.delivery_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null default ''::text,
  phone text not null default ''::text,
  username text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.shop_orders
  drop constraint if exists shop_orders_customer_user_id_fkey,
  drop constraint if exists shop_orders_assigned_driver_id_fkey;

alter table public.shop_orders
  add constraint shop_orders_customer_user_id_fkey
  foreign key (customer_user_id) references public.customer_users(id) on delete set null;

alter table public.shop_orders
  add constraint shop_orders_assigned_driver_id_fkey
  foreign key (assigned_driver_id) references public.delivery_agents(id) on delete set null;

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
create unique index if not exists customer_users_email_unique on public.customer_users (lower(email));
create unique index if not exists customer_users_phone_unique on public.customer_users (phone);
create unique index if not exists customer_favorites_customer_product_unique on public.customer_favorites (customer_id, product_id);
create unique index if not exists customer_password_resets_token_unique on public.customer_password_resets (token);
create unique index if not exists delivery_agents_username_unique on public.delivery_agents (username);
create index if not exists customer_notifications_customer_created_idx on public.customer_notifications (customer_id, created_at desc);
create index if not exists customer_addresses_customer_idx on public.customer_addresses (customer_id);
create index if not exists shop_orders_customer_user_idx on public.shop_orders (customer_user_id);
create index if not exists shop_orders_assigned_driver_idx on public.shop_orders (assigned_driver_id);

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

drop trigger if exists set_customer_users_updated_at on public.customer_users;
create trigger set_customer_users_updated_at
before update on public.customer_users
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_customer_addresses_updated_at on public.customer_addresses;
create trigger set_customer_addresses_updated_at
before update on public.customer_addresses
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_delivery_agents_updated_at on public.delivery_agents;
create trigger set_delivery_agents_updated_at
before update on public.delivery_agents
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
