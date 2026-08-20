-- Add a phone number to sponsorships, and a per-contact activity log
-- (calls, texts, emails, meetings, etc.) for the Sponsorship CRM.

alter table sponsorships add column if not exists phone text;

create type activity_type as enum ('call', 'text', 'email', 'meeting', 'other');

create table sponsorship_activities (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references sponsorships(id) on delete cascade,
  type activity_type not null,
  notes text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table sponsorship_activities enable row level security;

create policy "authenticated_full_access" on sponsorship_activities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
