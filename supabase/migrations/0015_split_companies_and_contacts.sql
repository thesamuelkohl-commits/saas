-- Split the CRM into companies (brands/creators you're pursuing) and
-- contacts (people at those companies) — one company can have multiple
-- contacts. Also adds a location field to companies.

alter table sponsorships rename to companies;
alter table companies add column if not exists location text;
alter type sponsorship_stage rename to company_stage;
alter trigger sponsorships_updated_at on companies rename to companies_updated_at;

create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text,
  email text,
  phone text,
  role text,
  created_at timestamptz not null default now()
);

alter table contacts enable row level security;
create policy "authenticated_full_access" on contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- carry existing embedded contact info over into the new contacts table
insert into contacts (company_id, name, email, phone)
select id, contact_name, contact_email, phone
from companies
where contact_name is not null or contact_email is not null or phone is not null;

alter table companies drop column if exists contact_name;
alter table companies drop column if exists contact_email;
alter table companies drop column if exists phone;

-- rename the activity log to match
alter table sponsorship_activities rename to company_activities;
alter table company_activities rename column sponsorship_id to company_id;
