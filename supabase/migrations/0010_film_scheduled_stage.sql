-- Add a "Film Scheduled" stage between Idea and Filmed/Editing, plus its
-- own date field for when filming is booked (distinct from film_date,
-- which is when it was actually/is being filmed).
alter type content_stage add value if not exists 'film_scheduled' before 'editing';

alter table content_items add column if not exists film_scheduled_date date;
