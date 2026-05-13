alter table public.users
add column if not exists bio text,
add column if not exists status text not null default 'offline' check (status in ('online', 'offline', 'busy'));

create or replace view public.profiles as
select id, full_name, username, email, display_name, avatar_url, bio, status, created_at, updated_at
from public.users;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_not_self check (requester_id <> receiver_id)
);

create unique index if not exists friend_requests_pending_unique
on public.friend_requests (least(requester_id, receiver_id), greatest(requester_id, receiver_id))
where status = 'pending';

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  user_low_id uuid not null references public.users(id) on delete cascade,
  user_high_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friendships_ordered check (user_low_id < user_high_id),
  constraint friendships_unique unique (user_low_id, user_high_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'direct' check (type in ('direct', 'group')),
  name text,
  image_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);

alter table public.messages
add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

alter table public.messages
alter column room_id drop not null;

create index if not exists friend_requests_requester_idx on public.friend_requests(requester_id);
create index if not exists friend_requests_receiver_idx on public.friend_requests(receiver_id);
create index if not exists friendships_low_idx on public.friendships(user_low_id);
create index if not exists friendships_high_idx on public.friendships(user_high_id);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorites_has_target check (target_user_id is not null or conversation_id is not null)
);

create unique index if not exists favorites_user_target_unique
on public.favorites(user_id, target_user_id)
where target_user_id is not null;

create unique index if not exists favorites_user_conversation_unique
on public.favorites(user_id, conversation_id)
where conversation_id is not null;

create table if not exists public.groups (
  id uuid primary key references public.conversations(id) on delete cascade,
  name text not null,
  image_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_messages (
  id uuid primary key references public.messages(id) on delete cascade,
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.friendships
    where user_low_id = least(user_a, user_b)
      and user_high_id = greatest(user_a, user_b)
  );
$$;

create or replace function public.is_conversation_member(conversation_uuid uuid, user_uuid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_id = conversation_uuid
      and user_id = user_uuid
  );
$$;

create or replace function public.notify_user(target_user uuid, actor_user uuid, notice_type text, notice_title text, notice_body text, entity_kind text, entity_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, title, body, entity_type, entity_id)
  values (target_user, actor_user, notice_type, notice_title, notice_body, entity_kind, entity_uuid);
end;
$$;

create or replace function public.accept_friend_request(request_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.friend_requests%rowtype;
  convo_id uuid;
begin
  select * into req
  from public.friend_requests
  where id = request_uuid
    and receiver_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'Request not found or already handled';
  end if;

  update public.friend_requests
  set status = 'accepted', responded_at = now()
  where id = request_uuid;

  insert into public.friendships (user_low_id, user_high_id)
  values (least(req.requester_id, req.receiver_id), greatest(req.requester_id, req.receiver_id))
  on conflict do nothing;

  insert into public.conversations (type, created_by)
  values ('direct', req.receiver_id)
  returning id into convo_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values (convo_id, req.requester_id, 'member'), (convo_id, req.receiver_id, 'member')
  on conflict do nothing;

  perform public.notify_user(req.requester_id, req.receiver_id, 'request_accepted', 'Chat request accepted', 'You can now chat together.', 'conversation', convo_id);
end;
$$;

alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.notifications enable row level security;
alter table public.favorites enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_messages enable row level security;

drop policy if exists "Users can read their friend requests" on public.friend_requests;
create policy "Users can read their friend requests"
on public.friend_requests for select
to authenticated
using (requester_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "Users can create friend requests" on public.friend_requests;
create policy "Users can create friend requests"
on public.friend_requests for insert
to authenticated
with check (requester_id = auth.uid() and requester_id <> receiver_id and not public.are_friends(requester_id, receiver_id));

drop policy if exists "Request participants can update requests" on public.friend_requests;
create policy "Request participants can update requests"
on public.friend_requests for update
to authenticated
using (requester_id = auth.uid() or receiver_id = auth.uid())
with check (requester_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "Users can read their friendships" on public.friendships;
create policy "Users can read their friendships"
on public.friendships for select
to authenticated
using (user_low_id = auth.uid() or user_high_id = auth.uid());

drop policy if exists "Members can read conversations" on public.conversations;
create policy "Members can read conversations"
on public.conversations for select
to authenticated
using (public.is_conversation_member(id));

drop policy if exists "Authenticated users can create conversations" on public.conversations;
create policy "Authenticated users can create conversations"
on public.conversations for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Members can update conversations" on public.conversations;
create policy "Members can update conversations"
on public.conversations for update
to authenticated
using (public.is_conversation_member(id))
with check (public.is_conversation_member(id));

drop policy if exists "Members can read conversation memberships" on public.conversation_members;
create policy "Members can read conversation memberships"
on public.conversation_members for select
to authenticated
using (public.is_conversation_member(conversation_id));

drop policy if exists "Creators can add conversation members" on public.conversation_members;
create policy "Creators can add conversation members"
on public.conversation_members for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1 from public.conversations
    where conversations.id = conversation_members.conversation_id
      and conversations.created_by = auth.uid()
  )
);

drop policy if exists "Members can read conversation messages" on public.messages;
create policy "Members can read conversation messages"
on public.messages for select
to authenticated
using (
  (room_id is not null and public.is_room_member(room_id))
  or (conversation_id is not null and public.is_conversation_member(conversation_id))
);

drop policy if exists "Members can send conversation messages" on public.messages;
create policy "Members can send conversation messages"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and (
    (room_id is not null and public.is_room_member(room_id))
    or (conversation_id is not null and public.is_conversation_member(conversation_id))
  )
);

drop policy if exists "Users can read their notifications" on public.notifications;
create policy "Users can read their notifications"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can create notifications for interactions" on public.notifications;
create policy "Users can create notifications for interactions"
on public.notifications for insert
to authenticated
with check (actor_id = auth.uid() or user_id = auth.uid());

drop policy if exists "Users manage their favorites" on public.favorites;
create policy "Users manage their favorites"
on public.favorites for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Members can read groups" on public.groups;
create policy "Members can read groups"
on public.groups for select
to authenticated
using (exists (select 1 from public.group_members where group_id = groups.id and user_id = auth.uid()));

drop policy if exists "Authenticated users can create groups" on public.groups;
create policy "Authenticated users can create groups"
on public.groups for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Group members can read group members" on public.group_members;
create policy "Group members can read group members"
on public.group_members for select
to authenticated
using (exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid()));

drop policy if exists "Group creators can add friends" on public.group_members;
create policy "Group creators can add friends"
on public.group_members for insert
to authenticated
with check (
  user_id = auth.uid()
  or (
    exists (select 1 from public.groups where groups.id = group_members.group_id and groups.created_by = auth.uid())
    and public.are_friends(auth.uid(), user_id)
  )
);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('group-images', 'group-images', true)
on conflict (id) do nothing;

drop policy if exists "Users can upload their avatars" on storage.objects;
create policy "Users can upload their avatars"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their avatars" on storage.objects;
create policy "Users can update their avatars"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Anyone can read public avatars" on storage.objects;
create policy "Anyone can read public avatars"
on storage.objects for select
to authenticated
using (bucket_id in ('avatars', 'group-images'));

alter table public.friend_requests replica identity full;
alter table public.friendships replica identity full;
alter table public.conversations replica identity full;
alter table public.conversation_members replica identity full;
alter table public.notifications replica identity full;
alter table public.favorites replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friend_requests') then
    alter publication supabase_realtime add table public.friend_requests;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships') then
    alter publication supabase_realtime add table public.friendships;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_members') then
    alter publication supabase_realtime add table public.conversation_members;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
    alter publication supabase_realtime add table public.notifications;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'favorites') then
    alter publication supabase_realtime add table public.favorites;
  end if;
end;
$$;
