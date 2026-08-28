-- Distinguish creator collab outreach from brand deal outreach on the CRM.
create type contact_type as enum ('creator', 'brand');

alter table sponsorships add column if not exists contact_type contact_type;
