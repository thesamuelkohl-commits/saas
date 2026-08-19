# Eat With Sam K — Ops Hub

Personal SaaS for running the food-content business: sponsorship CRM, content
pipeline, platform tracker, review manager, website pipeline, SEO tracker,
revenue, and analytics — all in one place.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth) — single shared password, row-level security

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql) to create all tables, enums, and RLS policies.
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL and anon key (Supabase → Project Settings → API).
4. Install and run:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`, sign in with the shared password, and start filling in restaurants, content, and reviews.

Auth is a single Supabase user (`thesamuelkohl@gmail.com`) signed in by password, not per-visitor accounts — the password is the gate. Anyone with it has full read/write access. Change it any time via the Supabase dashboard (Authentication → Users → edit user → reset password) or the Admin API.

## Modules

| Module | Table(s) |
| --- | --- |
| Dashboard | rollups across all tables |
| Content Pipeline | `content_items` |
| Platform Tracker | `platform_posts` |
| Review Manager | `reviews` |
| Restaurants | `restaurants` |
| Wish List | `wishlist_items` |
| Website Pipeline | `website_pages` |
| SEO Tracker | `seo_entries` |
| Sponsorship CRM | `sponsorships` |
| Revenue | `revenue_entries` |

## Notes on this first pass

- Every module uses the same generic CRUD engine (`src/components/crud`), so the UI is intentionally plain — list + inline add/edit forms, no drag-and-drop kanban yet.
- Review photo uploads aren't wired up yet (the `reviews.photos` column exists but has no UI).
- All CRUD mutations run through the Supabase browser client directly (no server actions) — RLS is the real security boundary here, since this is a single-user tool.
# saas
