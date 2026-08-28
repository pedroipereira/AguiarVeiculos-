create extension if not exists "uuid-ossp";

create type vehicle_status as enum ('available', 'sold');
create type lead_type as enum ('financing', 'trade_in');

create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  brand text not null,
  model text not null,
  version text,
  year_model integer not null,
  year_fabrication integer not null,
  mileage_km integer not null default 0,
  price_cents integer not null,
  fuel_type text,
  transmission text,
  color text,
  description text,
  is_featured boolean not null default false,
  status vehicle_status not null default 'available',
  plate text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vehicle_images (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  storage_path text not null,
  display_order integer not null default 0
);

create table leads (
  id uuid primary key default uuid_generate_v4(),
  type lead_type not null,
  name text not null,
  phone text not null,
  details jsonb,
  vehicle_id uuid references vehicles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table testimonials (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  caption text not null,
  display_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table site_settings (
  key text primary key,
  value text
);

insert into site_settings (key, value) values ('location_video_url', null);

-- Public-safe views: never expose `plate`, never expose unpublished testimonials.
create view vehicles_public as
  select id, slug, brand, model, version, year_model, year_fabrication, mileage_km,
         price_cents, fuel_type, transmission, color, description, is_featured,
         status, created_at, updated_at
  from vehicles;

create view testimonials_published as
  select id, image_url, caption, display_order, created_at
  from testimonials
  where is_published = true;

-- Row Level Security
alter table vehicles enable row level security;
alter table vehicle_images enable row level security;
alter table leads enable row level security;
alter table testimonials enable row level security;
alter table site_settings enable row level security;

-- Base tables: only authenticated (admin) sessions may touch them directly.
-- Public code must read through the *_public views instead (granted below).
create policy "admin full access to vehicles" on vehicles
  for all to authenticated using (true) with check (true);
create policy "admin full access to vehicle_images" on vehicle_images
  for all to authenticated using (true) with check (true);
create policy "admin read access to leads" on leads
  for select to authenticated using (true);
create policy "anyone can insert a lead" on leads
  for insert to anon, authenticated with check (true);
create policy "admin full access to testimonials" on testimonials
  for all to authenticated using (true) with check (true);
create policy "admin full access to site_settings" on site_settings
  for all to authenticated using (true) with check (true);
create policy "anyone can read site_settings" on site_settings
  for select to anon, authenticated using (true);
create policy "anyone can read vehicle_images" on vehicle_images
  for select to anon, authenticated using (true);

grant select on vehicles_public to anon, authenticated;
grant select on testimonials_published to anon, authenticated;

-- Storage buckets for vehicle and testimonial photos.
insert into storage.buckets (id, name, public)
values ('vehicle-images', 'vehicle-images', true), ('testimonial-images', 'testimonial-images', true)
on conflict (id) do nothing;

create policy "public can read vehicle-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'vehicle-images');
create policy "admin can write vehicle-images" on storage.objects
  for all to authenticated using (bucket_id = 'vehicle-images') with check (bucket_id = 'vehicle-images');
create policy "public can read testimonial-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'testimonial-images');
create policy "admin can write testimonial-images" on storage.objects
  for all to authenticated using (bucket_id = 'testimonial-images') with check (bucket_id = 'testimonial-images');
