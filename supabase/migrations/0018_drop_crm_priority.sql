-- The CRM no longer tracks a priority level.
alter table companies drop column if exists priority;
