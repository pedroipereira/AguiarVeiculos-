-- These columns are deliberately never added to `vehicles_public` — they're
-- financial/internal data and must never reach the public site.
alter type vehicle_status add value if not exists 'preparing';

alter table vehicles
  add column if not exists acquired_at date,
  add column if not exists acquisition_cost_cents integer,
  add column if not exists min_sale_price_cents integer,
  add column if not exists sale_price_cents integer,
  add column if not exists sold_at date,
  add column if not exists buyer_lead_id uuid references leads(id) on delete set null,
  add column if not exists fipe_brand_code text,
  add column if not exists fipe_model_code text,
  add column if not exists fipe_year_code text,
  add column if not exists fipe_value_cents integer,
  add column if not exists fipe_fetched_at timestamptz,
  add column if not exists optionals text[] not null default '{}';

create table if not exists vehicle_expenses (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  category text not null check (category in (
    'pintura', 'lavagem_higienizacao', 'mecanica', 'documentacao', 'funilaria', 'outros'
  )),
  description text,
  amount_cents integer not null,
  created_at timestamptz not null default now()
);

create index if not exists vehicle_expenses_vehicle_id_idx on vehicle_expenses(vehicle_id);

alter table vehicle_expenses enable row level security;

drop policy if exists "admin full access to vehicle_expenses" on vehicle_expenses;
create policy "admin full access to vehicle_expenses" on vehicle_expenses
  for all to authenticated using (true) with check (true);

-- Editable from Configurações — never hardcoded in the app.
insert into site_settings (key, value) values ('stock_turnover_threshold_days', '90')
  on conflict (key) do nothing;
