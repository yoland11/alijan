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
