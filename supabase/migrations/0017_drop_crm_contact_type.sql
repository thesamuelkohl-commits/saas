-- The CRM only tracks brands now, so the creator/brand type is redundant.
alter table companies drop column if exists contact_type;
drop type if exists contact_type;
