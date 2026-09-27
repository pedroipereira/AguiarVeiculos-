-- Real-world tank capacities and plate-lookup horsepower conversions aren't
-- always whole numbers (e.g. 54.5 L, or a kW-to-cv conversion like 116.18),
-- but these columns were integer — rejecting anything fractional.
alter table vehicles
  alter column fuel_tank_liters type numeric,
  alter column horsepower type numeric;
