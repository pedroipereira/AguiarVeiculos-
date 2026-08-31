create table site_images (
  id uuid primary key default uuid_generate_v4(),
  slot text not null,
  storage_path text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table site_images enable row level security;

create policy "admin full access to site_images" on site_images
  for all to authenticated using (true) with check (true);
create policy "anyone can read site_images" on site_images
  for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;

create policy "public can read site-images" on storage.objects
  for select to anon, authenticated using (bucket_id = 'site-images');
create policy "admin can write site-images" on storage.objects
  for all to authenticated using (bucket_id = 'site-images') with check (bucket_id = 'site-images');
