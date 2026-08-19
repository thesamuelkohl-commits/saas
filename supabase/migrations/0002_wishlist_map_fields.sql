-- Adds geocoding + preview photo fields to wishlist_items for the map view.
alter table wishlist_items
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists photo_url text;
