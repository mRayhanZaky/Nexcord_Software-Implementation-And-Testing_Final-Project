alter table public.conversations
add column if not exists description text;

alter table public.groups
add column if not exists description text;

alter table public.messages
add column if not exists message_type text not null default 'text' check (message_type in ('text', 'image', 'video', 'file')),
add column if not exists delivered_at timestamptz,
add column if not exists read_at timestamptz,
add column if not exists media_url text,
add column if not exists media_type text,
add column if not exists file_name text,
add column if not exists file_size bigint check (file_size is null or file_size <= 5242880),
add column if not exists reply_to_message_id uuid references public.messages(id) on delete set null;

create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id)
);

create table if not exists public.message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 32),
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists message_receipts_user_idx on public.message_receipts(user_id);
create index if not exists message_reactions_message_idx on public.message_reactions(message_id);
create index if not exists message_reactions_user_idx on public.message_reactions(user_id);

alter table public.message_receipts enable row level security;
alter table public.message_reactions enable row level security;

drop policy if exists "Members can read message receipts" on public.message_receipts;
create policy "Members can read message receipts"
on public.message_receipts for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = message_receipts.message_id
      and (
        (messages.room_id is not null and public.is_room_member(messages.room_id))
        or (messages.conversation_id is not null and public.is_conversation_member(messages.conversation_id))
      )
  )
);

drop policy if exists "Members can write own receipts" on public.message_receipts;
create policy "Members can write own receipts"
on public.message_receipts for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.messages
    where messages.id = message_receipts.message_id
      and messages.sender_id <> auth.uid()
      and (
        (messages.room_id is not null and public.is_room_member(messages.room_id))
        or (messages.conversation_id is not null and public.is_conversation_member(messages.conversation_id))
      )
  )
);

drop policy if exists "Users can update own receipts" on public.message_receipts;
create policy "Users can update own receipts"
on public.message_receipts for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Members can read message reactions" on public.message_reactions;
create policy "Members can read message reactions"
on public.message_reactions for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = message_reactions.message_id
      and (
        (messages.room_id is not null and public.is_room_member(messages.room_id))
        or (messages.conversation_id is not null and public.is_conversation_member(messages.conversation_id))
      )
  )
);

drop policy if exists "Members can add message reactions" on public.message_reactions;
create policy "Members can add message reactions"
on public.message_reactions for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.messages
    where messages.id = message_reactions.message_id
      and (
        (messages.room_id is not null and public.is_room_member(messages.room_id))
        or (messages.conversation_id is not null and public.is_conversation_member(messages.conversation_id))
      )
  )
);

drop policy if exists "Users can delete own message reactions" on public.message_reactions;
create policy "Users can delete own message reactions"
on public.message_reactions for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Members can update delivery fields" on public.messages;
create policy "Members can update delivery fields"
on public.messages for update
to authenticated
using (
  sender_id = auth.uid()
  or (
    conversation_id is not null
    and public.is_conversation_member(conversation_id)
    and sender_id <> auth.uid()
  )
)
with check (
  sender_id = auth.uid()
  or (
    conversation_id is not null
    and public.is_conversation_member(conversation_id)
    and sender_id <> auth.uid()
  )
);

drop policy if exists "Members can read conversation attachments" on public.attachments;
create policy "Members can read conversation attachments"
on public.attachments for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = attachments.message_id
      and (
        (messages.room_id is not null and public.is_room_member(messages.room_id))
        or (messages.conversation_id is not null and public.is_conversation_member(messages.conversation_id))
      )
  )
);

drop policy if exists "Message authors can create conversation attachments" on public.attachments;
create policy "Message authors can create conversation attachments"
on public.attachments for insert
to authenticated
with check (
  exists (
    select 1
    from public.messages
    where messages.id = attachments.message_id
      and messages.sender_id = auth.uid()
  )
);

update storage.buckets
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain',
      'application/zip',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
where id = 'chat-attachments';

alter table public.messages replica identity full;
alter table public.attachments replica identity full;
alter table public.message_receipts replica identity full;
alter table public.message_reactions replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'attachments') then
    alter publication supabase_realtime add table public.attachments;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_receipts') then
    alter publication supabase_realtime add table public.message_receipts;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions') then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end;
$$;
