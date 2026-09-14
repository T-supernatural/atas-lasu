-- Phase 3: counterpart to the existing increment_event_likes(event_id_input)
-- function. Apply this through the Supabase SQL editor or CLI before enabling
-- unlike in production. RLS policies are defined in Phase 5.

create or replace function public.decrement_event_likes(event_id_input uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.events
  set likes = greatest(coalesce(likes, 0) - 1, 0)
  where id = event_id_input;
$$;

revoke all on function public.decrement_event_likes(uuid) from public;
grant execute on function public.decrement_event_likes(uuid) to authenticated;
