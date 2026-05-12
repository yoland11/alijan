alter table public.shop_orders
  add column if not exists customer_user_id uuid,
  add column if not exists assigned_driver_id uuid,
  add column if not exists assigned_driver_name text not null default '',
  add column if not exists assigned_at timestamptz;

alter table public.shop_orders
  drop constraint if exists shop_orders_status_check;

alter table public.shop_orders
  add constraint shop_orders_status_check
  check (status in ('طلب جديد', 'قيد التجهيز', 'جاهز للتوصيل', 'استلمت الطلب', 'بالطريق', 'تم التسليم', 'ملغي'));

create table if not exists public.customer_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default '',
  email text not null,
  phone text not null,
  password_hash text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customer_users(id) on delete cascade,
  label text not null default '',
  province text not null default '',
  district text not null default '',
  address text not null default '',
  phone text not null default '',
  location_lat numeric(10,7),
  location_lng numeric(10,7),
  google_maps_url text not null default '',
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
  title text not null default '',
  body text not null default '',
  type text not null default 'general',
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
  name text not null default '',
  phone text not null default '',
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

create unique index if not exists customer_users_email_unique on public.customer_users (lower(email));
create unique index if not exists customer_users_phone_unique on public.customer_users (phone);
create unique index if not exists customer_favorites_customer_product_unique on public.customer_favorites (customer_id, product_id);
create unique index if not exists customer_password_resets_token_unique on public.customer_password_resets (token);
create unique index if not exists delivery_agents_username_unique on public.delivery_agents (username);
create index if not exists customer_notifications_customer_created_idx on public.customer_notifications (customer_id, created_at desc);
create index if not exists customer_addresses_customer_idx on public.customer_addresses (customer_id);
create index if not exists shop_orders_customer_user_idx on public.shop_orders (customer_user_id);
create index if not exists shop_orders_assigned_driver_idx on public.shop_orders (assigned_driver_id);

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
