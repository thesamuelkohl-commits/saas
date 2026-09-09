-- Add a website field to CRM contacts.
alter table sponsorships add column if not exists website text;
