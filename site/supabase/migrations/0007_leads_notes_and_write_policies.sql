-- Free-text notes for a lead, edited via the kanban card's edit modal and
-- shown directly on the card.
alter table leads add column notes text;

-- `leads` only had "admin read" (select) and "anyone can insert" policies
-- (RLS default-denies everything else) — the kanban board needs to move a
-- lead between funnel stages, edit its fields, and delete it.
create policy "admin update access to leads" on leads
  for update to authenticated using (true) with check (true);
create policy "admin delete access to leads" on leads
  for delete to authenticated using (true);
