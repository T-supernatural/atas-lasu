-- Phase 5: ATAS-LASU authorization lockdown.
-- Replaces the legacy policies found during the policy audit. Apply this as one
-- migration in the Supabase SQL editor before releasing the admin dashboard.

begin;

-- event_likes.id is an existing identity column. Identity columns deliberately
-- show no standard column_default in information_schema, but generate IDs
-- automatically, so no sequence/default change is required here.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'event_likes_one_per_member'
      and conrelid = 'public.event_likes'::regclass
  ) then
    alter table public.event_likes
    add constraint event_likes_one_per_member unique (event_id, user_id);
  end if;
end;
$$;

-- Security-definer avoids recursive profiles RLS checks. It exposes only a
-- boolean answer and is the single definition of an ATAS administrator.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- A single transaction prevents duplicate likes and keeps the denormalized
-- events.likes counter in sync with event_likes.
create or replace function public.toggle_event_like(event_id_input bigint)
returns table(liked boolean, likes bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to like an event';
  end if;
  if not exists (select 1 from public.events where id = event_id_input) then
    raise exception 'Event does not exist';
  end if;

  if exists (
    select 1 from public.event_likes
    where event_id = event_id_input and user_id = current_user_id
  ) then
    delete from public.event_likes
    where event_id = event_id_input and user_id = current_user_id;
    update public.events as event
    set likes = greatest(coalesce(likes, 0) - 1, 0)
    where id = event_id_input
    returning false, event.likes into liked, likes;
  else
    insert into public.event_likes (event_id, user_id)
    values (event_id_input, current_user_id);
    update public.events as event
    set likes = coalesce(likes, 0) + 1
    where id = event_id_input
    returning true, event.likes into liked, likes;
  end if;
  return next;
end;
$$;
revoke all on function public.toggle_event_like(bigint) from public;
grant execute on function public.toggle_event_like(bigint) to authenticated;
revoke execute on function public.increment_event_likes(bigint) from authenticated;
revoke execute on function public.decrement_event_likes(bigint) from authenticated;

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.events enable row level security;
alter table public.event_likes enable row level security;
alter table public.messages enable row level security;

-- Remove every policy identified in the audit, including legacy permissive
-- rules and Phase 4's temporary message policies.
drop policy if exists "Enable read access for all users" on public.profiles;
drop policy if exists "Users can insert their data" on public.profiles;
drop policy if exists "Users can see their data" on public.profiles;
drop policy if exists "Users can update their data" on public.profiles;
drop policy if exists "Enable read access for all users" on public.resources;
drop policy if exists "Enable insert for admins only" on public.resources;
drop policy if exists "Enable update for admins" on public.resources;
drop policy if exists "Enable delete for admins" on public.resources;
drop policy if exists "Enable read access for all users" on public.events;
drop policy if exists "Enable insert for admins only" on public.events;
drop policy if exists "Enable update for admins only" on public.events;
drop policy if exists "Allow update for likes" on public.events;
drop policy if exists "Enable delete for admins" on public.events;
drop policy if exists "allow user to see like" on public.event_likes;
drop policy if exists "allow admins to see all likes" on public.event_likes;
drop policy if exists "Allow users to insert likes" on public.event_likes;
drop policy if exists "Allow users to delete likes" on public.event_likes;
drop policy if exists "Enable read access for all users" on public.messages;
drop policy if exists "Enable insert for authenticated users only" on public.messages;
drop policy if exists "Enable update for users based on email" on public.messages;
drop policy if exists "Enable delete for users based on user_id" on public.messages;
drop policy if exists "members can read chat messages" on public.messages;
drop policy if exists "members can send their own messages" on public.messages;
drop policy if exists "members can delete their own messages" on public.messages;

create policy "profiles: members read own, admins read all" on public.profiles for select to authenticated using (auth.uid() = id or public.is_admin());
create policy "profiles: members create own user profile" on public.profiles for insert to authenticated with check (auth.uid() = id and coalesce(role, 'user') = 'user');
create policy "profiles: safe self-update or admin update" on public.profiles for update to authenticated using (auth.uid() = id or public.is_admin()) with check (public.is_admin() or (auth.uid() = id and coalesce(role, 'user') = 'user'));

create policy "resources: public read" on public.resources for select to public using (true);
create policy "resources: admin write" on public.resources for insert to authenticated with check (public.is_admin());
create policy "resources: admin update" on public.resources for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "resources: admin delete" on public.resources for delete to authenticated using (public.is_admin());

create policy "events: public read" on public.events for select to public using (true);
create policy "events: admin write" on public.events for insert to authenticated with check (public.is_admin());
create policy "events: admin update" on public.events for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "events: admin delete" on public.events for delete to authenticated using (public.is_admin());

create policy "event likes: member reads own, admin reads all" on public.event_likes for select to authenticated using (auth.uid() = user_id or public.is_admin());
-- Direct mutations are intentionally denied: toggle_event_like is the only
-- member mutation path and updates both tables atomically.

create policy "messages: members read" on public.messages for select to authenticated using (true);
create policy "messages: members send own" on public.messages for insert to authenticated with check (auth.uid() = user_id);
create policy "messages: members delete own" on public.messages for delete to authenticated using (auth.uid() = user_id);

-- Storage policies use the same server-side role check. The buckets remain
-- public for existing public resource/event links, but only admins can mutate.
drop policy if exists "Admins can delete files" on storage.objects;
drop policy if exists "Admins can select files" on storage.objects;
drop policy if exists "Admins can update files" on storage.objects;
drop policy if exists "Admins can upload files" on storage.objects;
drop policy if exists "All users can view resources" on storage.objects;
drop policy if exists "user-preview-download 128fyud_0" on storage.objects;
create policy "ATAS public asset read" on storage.objects for select to public using (bucket_id in ('resources', 'events'));
create policy "ATAS admin asset upload" on storage.objects for insert to authenticated with check (bucket_id in ('resources', 'events') and public.is_admin());
create policy "ATAS admin asset update" on storage.objects for update to authenticated using (bucket_id in ('resources', 'events') and public.is_admin()) with check (bucket_id in ('resources', 'events') and public.is_admin());
create policy "ATAS admin asset delete" on storage.objects for delete to authenticated using (bucket_id in ('resources', 'events') and public.is_admin());

commit;
