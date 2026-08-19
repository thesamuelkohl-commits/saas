-- Drop the restaurants master list in favor of a plain restaurant_name text
-- field on each table that needs one (content_items, reviews, website_pages).
-- Also adds a cuisine field to reviews (for "best-performing cuisine"
-- analytics) and a content_item_id link on revenue_entries (for revenue
-- attribution). All affected tables are currently empty, so this is safe.

alter table content_items drop column if exists restaurant_id;
alter table content_items add column if not exists restaurant_name text;

alter table reviews drop column if exists restaurant_id;
alter table reviews add column if not exists restaurant_name text;
alter table reviews add column if not exists cuisine text;

alter table website_pages drop column if exists restaurant_id;
alter table website_pages add column if not exists restaurant_name text;

alter table revenue_entries add column if not exists content_item_id uuid references content_items(id) on delete set null;

drop table if exists restaurants;
