-- Simplify the CRM. Run after 0018 (which adds the 'note' activity type).
--
-- Nothing here drops a column or deletes a value, so it's safe to re-run and
-- fully reversible: the hidden fields keep their data, the UI just stops
-- showing them.

-- 1. Portfolio Sent and Proposal Sent are gone from the status list. Any
--    company still sitting at one of them moves to call_discussion, which the
--    UI now labels "Negotiating". The enum values themselves are left in
--    place, since removing an enum value means rebuilding the whole type.
update companies
set stage = 'call_discussion'
where stage in ('portfolio_sent', 'proposal_sent');

-- 2. The company Notes field is gone from the UI, so carry every existing
--    note into that company's activity history as a 'note' entry. Dated to
--    when the company was added, since the note itself has no timestamp.
--    The not-exists guard keeps a re-run from duplicating them.
insert into company_activities (company_id, type, occurred_at, notes)
select c.id, 'note', c.created_at::date, btrim(c.notes)
from companies c
where nullif(btrim(c.notes), '') is not null
  and not exists (
    select 1 from company_activities a
    where a.company_id = c.id
      and a.type = 'note'
      and a.notes = btrim(c.notes)
  );

-- ugc_idea, first_contact_date, follow_up_1_date, follow_up_2_date,
-- last_contact_date, package_discussed and notes are all intentionally kept.
