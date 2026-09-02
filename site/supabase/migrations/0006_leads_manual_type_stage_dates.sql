-- Admin-created leads (quick "novo lead" form in the sidebar), alongside the
-- existing public-site lead types (financing, trade_in).
alter type lead_type add value 'manual';

-- Funnel stage a lead sits in, and the optional follow-up dates the admin
-- quick-add form collects.
create type lead_stage as enum ('novo', 'visita_marcada', 'negociando', 'ligar_de_volta', 'vendeu', 'nao_comprou');

alter table leads
  add column stage lead_stage not null default 'novo',
  add column first_contact_at date,
  add column store_visit_at date,
  add column scheduled_visit_date date,
  add column scheduled_visit_time time;
