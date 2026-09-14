-- Phase 4: member-only community chat. Apply this migration before releasing
-- the React chat page. It makes message ownership enforceable in the database.

alter table public.messages enable row level security;

drop policy if exists "members can read chat messages" on public.messages;
create policy "members can read chat messages"
on public.messages for select
to authenticated
using (true);

drop policy if exists "members can send their own messages" on public.messages;
create policy "members can send their own messages"
on public.messages for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "members can delete their own messages" on public.messages;
create policy "members can delete their own messages"
on public.messages for delete
to authenticated
using (auth.uid() = user_id);
