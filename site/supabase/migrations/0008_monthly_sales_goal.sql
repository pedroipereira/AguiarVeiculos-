-- No default value — an unset goal means "no goal defined yet", surfaced
-- as an empty state in the Painel rather than a misleading 0.
insert into site_settings (key, value) values ('monthly_sales_goal', null)
  on conflict (key) do nothing;
