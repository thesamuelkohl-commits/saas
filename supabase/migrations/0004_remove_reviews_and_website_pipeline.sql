-- Drop Review Manager and Website Pipeline modules entirely (both tables
-- are currently empty). seo_entries loses its FK to website_pages and
-- becomes a standalone URL-keyed table.

alter table seo_entries drop column if exists website_page_id;

drop table if exists website_pages;
drop table if exists reviews;
drop type if exists website_stage;
