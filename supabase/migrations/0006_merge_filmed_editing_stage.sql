-- Merge the 'filmed' and 'editing' content_stage values into a single
-- 'editing' stage (idea -> editing -> scheduled -> posted).
alter type content_stage rename to content_stage_old;

create type content_stage as enum ('idea', 'editing', 'scheduled', 'posted');

alter table content_items
  alter column stage drop default,
  alter column stage type content_stage using (
    case stage::text
      when 'filmed' then 'editing'
      else stage::text
    end
  )::content_stage,
  alter column stage set default 'idea';

drop type content_stage_old;
