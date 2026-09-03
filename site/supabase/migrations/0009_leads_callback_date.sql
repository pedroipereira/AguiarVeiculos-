-- A "ligar de volta" stage has no date today — this pair mirrors
-- scheduled_visit_date/scheduled_visit_time (migration 0006) so a callback
-- can be placed on a specific day/time in the Agenda calendar.
alter table leads
  add column callback_at date,
  add column callback_time time;
