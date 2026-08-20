-- Remove the due_date field from content_items entirely.
alter table content_items drop column if exists due_date;
