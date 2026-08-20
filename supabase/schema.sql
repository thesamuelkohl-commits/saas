-- Eat With Sam K — personal ops SaaS schema
-- Run this in the Supabase SQL editor (or `supabase db push` if using the CLI).
-- Single-user app: RLS just requires an authenticated session, no per-row ownership.

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type content_stage as enum ('idea', 'editing', 'scheduled', 'posted');
create type platform_name as enum ('tiktok', 'instagram', 'youtube');
create type platform_status as enum ('not_started', 'scheduled', 'posted');
create type sponsorship_stage as enum ('prospect', 'contacted', 'negotiating', 'deal_closed', 'worked_with', 'passed');
create type revenue_source as enum ('sponsorship', 'affiliate', 'ads', 'platform', 'other');
create type activity_type as enum ('call', 'text', 'email', 'meeting', 'other');

-- ---------- wish list ----------
create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_name text not null,
  location text,
  cuisine text,
  address text,
  phone text,
  website text,
  reason text,
  priority smallint not null default 2, -- 1 high, 2 medium, 3 low
  visited boolean not null default false,
  notes text,
  latitude double precision,
  longitude double precision,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- content pipeline ----------
create table content_items (
  id uuid primary key default gen_random_uuid(),
  inspo_link text,
  title text not null,
  stage content_stage not null default 'idea',
  notes text,
  film_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- platform tracker (per-video, per-platform status) ----------
create table platform_posts (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items(id) on delete cascade,
  platform platform_name not null,
  status platform_status not null default 'not_started',
  posted_at date,
  url text,
  views integer,
  likes integer,
  comments integer,
  created_at timestamptz not null default now(),
  unique (content_item_id, platform)
);

-- ---------- SEO tracker ----------
create table seo_entries (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  indexed boolean not null default false,
  impressions integer not null default 0,
  clicks integer not null default 0,
  avg_position numeric(5,2),
  last_checked date,
  created_at timestamptz not null default now()
);

-- ---------- sponsorship CRM ----------
create table sponsorships (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  contact_name text,
  contact_email text,
  phone text,
  stage sponsorship_stage not null default 'prospect',
  deal_value numeric(10,2),
  notes text,
  last_contact_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- sponsorship activity log ----------
create table sponsorship_activities (
  id uuid primary key default gen_random_uuid(),
  sponsorship_id uuid not null references sponsorships(id) on delete cascade,
  type activity_type not null,
  notes text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------- revenue ----------
create table revenue_entries (
  id uuid primary key default gen_random_uuid(),
  source revenue_source not null,
  sponsorship_id uuid references sponsorships(id) on delete set null,
  content_item_id uuid references content_items(id) on delete set null,
  amount numeric(10,2) not null,
  entry_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- updated_at trigger helper ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger content_items_updated_at before update on content_items
  for each row execute function set_updated_at();
create trigger sponsorships_updated_at before update on sponsorships
  for each row execute function set_updated_at();

-- ---------- RLS: single-user app, any authenticated session gets full access ----------
alter table wishlist_items enable row level security;
alter table content_items enable row level security;
alter table platform_posts enable row level security;
alter table seo_entries enable row level security;
alter table sponsorships enable row level security;
alter table sponsorship_activities enable row level security;
alter table revenue_entries enable row level security;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'wishlist_items', 'content_items', 'platform_posts',
      'seo_entries', 'sponsorships', 'sponsorship_activities', 'revenue_entries'
    ])
  loop
    execute format(
      'create policy "authenticated_full_access" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'')',
      t
    );
  end loop;
end $$;
