-- `optionals` (equipment list, e.g. "Ar condicionado") was bundled into
-- migration 0005's blanket "never expose publicly" comment alongside truly
-- sensitive financial columns, even though it isn't sensitive itself. Adds
-- it to the public view so vehicle detail pages can show it.
create or replace view vehicles_public as
  select id, slug, brand, model, version, year_model, year_fabrication, mileage_km,
         price_cents, fuel_type, transmission, color, description, is_featured,
         status, created_at, updated_at, engine, fuel_tank_liters, seating_capacity,
         body_type, doors, horsepower, optionals
  from vehicles;
