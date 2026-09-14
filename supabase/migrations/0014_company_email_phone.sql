-- Add general email/phone fields at the company level (distinct from
-- per-contact email/phone on named individuals within a company).
alter table companies add column if not exists email text;
alter table companies add column if not exists phone text;
