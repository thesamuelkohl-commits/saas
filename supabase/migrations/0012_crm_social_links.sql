-- Add Instagram and TikTok profile links to CRM contacts.
alter table sponsorships add column if not exists instagram_url text;
alter table sponsorships add column if not exists tiktok_url text;
