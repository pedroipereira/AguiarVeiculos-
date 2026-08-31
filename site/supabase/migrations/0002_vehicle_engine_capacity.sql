alter table vehicles
  add column engine text,
  add column fuel_tank_liters integer,
  add column seating_capacity integer;

-- Column list must match the existing view order, then append the new columns.
create or replace view vehicles_public as
  select id, slug, brand, model, version, year_model, year_fabrication, mileage_km,
         price_cents, fuel_type, transmission, color, description, is_featured,
         status, created_at, updated_at, engine, fuel_tank_liters, seating_capacity
  from vehicles;
