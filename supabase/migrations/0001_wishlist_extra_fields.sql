-- Adds structured fields to wishlist_items to match the imported want-to-try CSV.
alter table wishlist_items
  add column if not exists cuisine text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists website text;
