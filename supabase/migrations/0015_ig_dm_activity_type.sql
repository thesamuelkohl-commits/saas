-- Add an "IG DM" option to the CRM activity log.
alter type activity_type add value if not exists 'ig_dm' after 'text';
