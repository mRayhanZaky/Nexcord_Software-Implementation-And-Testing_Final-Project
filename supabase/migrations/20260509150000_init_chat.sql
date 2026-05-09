create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  username text unique,
  email text unique,
  phone_number text,
  secret_question text,
  secret_answer_hash text,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]{3,24}$')
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_private boolean not null default false,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  reply_to_id uuid references public.messages(id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists room_members_user_id_idx on public.room_members(user_id);
create index if not exists messages_room_created_idx on public.messages(room_id, created_at);
create index if not exists messages_sender_idx on public.messages(sender_id);
create index if not exists attachments_message_idx on public.attachments(message_id);
create index if not exists reactions_user_idx on public.reactions(user_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
before update on public.users
for each row execute function public.touch_updated_at();

drop trigger if exists rooms_touch_updated_at on public.rooms;
create trigger rooms_touch_updated_at
before update on public.rooms
for each row execute function public.touch_updated_at();

create or replace function public.is_room_member(room_uuid uuid, user_uuid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = room_uuid
      and user_id = user_uuid
  );
$$;

create or replace function public.is_room_admin(room_uuid uuid, user_uuid uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = room_uuid
      and user_id = user_uuid
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lobby_id uuid;
begin
  insert into public.users (id, full_name, username, email, phone_number, display_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'username', ''),
    lower(new.email),
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.users.full_name, excluded.full_name),
    username = coalesce(public.users.username, excluded.username),
    phone_number = coalesce(public.users.phone_number, excluded.phone_number),
    display_name = coalesce(public.users.display_name, excluded.display_name);

  select id into lobby_id from public.rooms where slug = 'lobby';

  if lobby_id is not null then
    insert into public.room_members (room_id, user_id, role)
    values (lobby_id, new.id, 'member')
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;
alter table public.reactions enable row level security;

drop policy if exists "Users are visible to authenticated users" on public.users;
create policy "Users are visible to authenticated users"
on public.users for select
to authenticated
using (true);

drop policy if exists "Users update their own profile" on public.users;
create policy "Users update their own profile"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.users;
create policy "Users can insert their own profile"
on public.users for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Members can read their rooms" on public.rooms;
create policy "Members can read their rooms"
on public.rooms for select
to authenticated
using (public.is_room_member(id));

drop policy if exists "Authenticated users can create rooms" on public.rooms;
create policy "Authenticated users can create rooms"
on public.rooms for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Room admins can update rooms" on public.rooms;
create policy "Room admins can update rooms"
on public.rooms for update
to authenticated
using (public.is_room_admin(id))
with check (public.is_room_admin(id));

drop policy if exists "Users can read memberships for their rooms" on public.room_members;
create policy "Users can read memberships for their rooms"
on public.room_members for select
to authenticated
using (public.is_room_member(room_id));

drop policy if exists "Room admins can manage members" on public.room_members;
create policy "Room admins can manage members"
on public.room_members for insert
to authenticated
with check (public.is_room_admin(room_id));

drop policy if exists "Room admins can update members" on public.room_members;
create policy "Room admins can update members"
on public.room_members for update
to authenticated
using (public.is_room_admin(room_id))
with check (public.is_room_admin(room_id));

drop policy if exists "Room admins can remove members" on public.room_members;
create policy "Room admins can remove members"
on public.room_members for delete
to authenticated
using (public.is_room_admin(room_id));

drop policy if exists "Members can read room messages" on public.messages;
create policy "Members can read room messages"
on public.messages for select
to authenticated
using (public.is_room_member(room_id));

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
on public.messages for insert
to authenticated
with check (sender_id = auth.uid() and public.is_room_member(room_id));

drop policy if exists "Authors can edit their messages" on public.messages;
create policy "Authors can edit their messages"
on public.messages for update
to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

drop policy if exists "Authors can delete their messages" on public.messages;
create policy "Authors can delete their messages"
on public.messages for delete
to authenticated
using (sender_id = auth.uid());

drop policy if exists "Members can read attachments" on public.attachments;
create policy "Members can read attachments"
on public.attachments for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = attachments.message_id
      and public.is_room_member(messages.room_id)
  )
);

drop policy if exists "Message authors can create attachments" on public.attachments;
create policy "Message authors can create attachments"
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

drop policy if exists "Members can read reactions" on public.reactions;
create policy "Members can read reactions"
on public.reactions for select
to authenticated
using (
  exists (
    select 1
    from public.messages
    where messages.id = reactions.message_id
      and public.is_room_member(messages.room_id)
  )
);

drop policy if exists "Members can react to visible messages" on public.reactions;
create policy "Members can react to visible messages"
on public.reactions for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.messages
    where messages.id = reactions.message_id
      and public.is_room_member(messages.room_id)
  )
);

drop policy if exists "Users can delete their own reactions" on public.reactions;
create policy "Users can delete their own reactions"
on public.reactions for delete
to authenticated
using (user_id = auth.uid());

insert into public.rooms (name, slug, description)
values ('Lobby', 'lobby', 'Default room for new members')
on conflict (slug) do nothing;

alter table public.messages replica identity full;
alter table public.reactions replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reactions'
  ) then
    alter publication supabase_realtime add table public.reactions;
  end if;
end;
$$;

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

drop policy if exists "Authenticated users can upload chat files" on storage.objects;
create policy "Authenticated users can upload chat files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'chat-attachments');

drop policy if exists "Authenticated users can read chat files" on storage.objects;
create policy "Authenticated users can read chat files"
on storage.objects for select
to authenticated
using (bucket_id = 'chat-attachments');
