alter table public.orders
  drop constraint if exists orders_service_type_check;

alter table public.orders
  add constraint orders_service_type_check
  check (service_type in ('Album', 'Session', 'Koshat', 'Gifts', 'Research', 'Graduation'));

alter table public.orders
  add column if not exists research_details jsonb not null default '{"title":"","student_names":"","supervisor_name":"","academic_entity":"","delivery_date":"","print_enabled":false,"copy_count":0,"binding_type":""}'::jsonb,
  add column if not exists research_files jsonb not null default '[]'::jsonb,
  add column if not exists graduation_details jsonb not null default '{"package_type":"","sash_type":"","robe_type":"","writing_type":"","measurements":{"sash_length":"","shoulder":"","robe_length":"","hand":""},"has_cap":false}'::jsonb;
