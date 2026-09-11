-- Add a free-text category field to CRM contacts (e.g. Hotel, Restaurant,
-- Event, Product) so contacts can be filtered by what kind of company
-- they are, similar to the Wish List's cuisine field.
alter table sponsorships add column if not exists category text;
