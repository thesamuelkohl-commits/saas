-- Add a "Note" option to the CRM activity log. Notes now live in the
-- activity history instead of a separate Notes field on the company.
--
-- Run this on its own, before 0019: Postgres won't let a new enum value be
-- used in the same transaction that adds it, and 0019 inserts 'note' rows.
alter type activity_type add value if not exists 'note' after 'meeting';
