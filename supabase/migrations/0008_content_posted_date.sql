-- Add a posted_date directly on content_items so the calendar and Kanban
-- can track/edit it without requiring a platform_posts row to exist.
alter table content_items add column if not exists posted_date date;
