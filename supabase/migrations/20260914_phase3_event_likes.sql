-- Phase 3: complete the event-like data contract used by the application.
-- The existing production events table uses bigint IDs and did not contain a
-- likes counter. This migration adds it, preserves existing likes recorded in
-- event_likes, and provides safe increment/decrement functions.

alter table public.events
add column if not exists likes bigint not null default 0;

-- Preserve any likes already recorded in the join table.
update public.events as event
set likes = (
  select count(*)
  from public.event_likes as event_like
  where event_like.event_id = event.id
);

create or replace function public.increment_event_likes(event_id_input bigint)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.events
  set likes = coalesce(likes, 0) + 1
  where id = event_id_input;
$$;

create or replace function public.decrement_event_likes(event_id_input bigint)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.events
  set likes = greatest(coalesce(likes, 0) - 1, 0)
  where id = event_id_input;
$$;

revoke all on function public.increment_event_likes(bigint) from public;
revoke all on function public.decrement_event_likes(bigint) from public;
grant execute on function public.increment_event_likes(bigint) to authenticated;
grant execute on function public.decrement_event_likes(bigint) to authenticated;
