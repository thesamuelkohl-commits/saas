-- Reshape the CRM around the UGC outreach pipeline: new status steps, plus
-- lead source, priority, UGC idea, follow-up dates, package, billing type,
-- and closed amount. deal_value is kept as-is and shown as "Quoted $".

create type company_stage_new as enum (
  'prospect', 'contacted', 'responded', 'portfolio_sent', 'call_discussion',
  'proposal_sent', 'won', 'monthly_client', 'lost_not_now'
);

alter table companies alter column stage drop default;
alter table companies alter column stage type company_stage_new using (
  case stage::text
    when 'negotiating' then 'call_discussion'
    when 'deal_closed' then 'won'
    when 'worked_with' then 'won'
    when 'passed' then 'lost_not_now'
    else stage::text
  end
)::company_stage_new;
-- the live DB may still carry the pre-0015 name for this type
drop type if exists company_stage;
drop type if exists sponsorship_stage;
alter type company_stage_new rename to company_stage;
alter table companies alter column stage set default 'prospect';

create type billing_type as enum ('one_time', 'monthly');

alter table companies
  add column if not exists lead_source text,
  add column if not exists priority smallint, -- 1 high, 2 medium, 3 low
  add column if not exists ugc_idea text,
  add column if not exists first_contact_date date,
  add column if not exists follow_up_1_date date,
  add column if not exists follow_up_2_date date,
  add column if not exists package_discussed text,
  add column if not exists billing_type billing_type,
  add column if not exists closed_amount numeric(10,2);
