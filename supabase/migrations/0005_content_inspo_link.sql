-- Repurpose content_items.restaurant_name as an "inspo link" field
-- (a reference URL to the content that inspired this idea).
alter table content_items rename column restaurant_name to inspo_link;
