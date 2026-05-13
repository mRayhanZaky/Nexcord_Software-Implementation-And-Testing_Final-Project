alter table public.messages
drop constraint if exists messages_message_type_check;

alter table public.messages
add constraint messages_message_type_check
check (message_type in ('text', 'image', 'video', 'file', 'voice'));

alter table public.messages
add column if not exists voice_url text,
add column if not exists voice_duration integer check (voice_duration is null or voice_duration >= 0);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-messages',
  'voice-messages',
  false,
  5242880,
  array['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
where id = 'group-images';

drop policy if exists "Users can upload group images" on storage.objects;
create policy "Users can upload group images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'group-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update group images" on storage.objects;
create policy "Users can update group images"
on storage.objects for update
to authenticated
using (bucket_id = 'group-images' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'group-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Conversation members can upload voice messages" on storage.objects;
create policy "Conversation members can upload voice messages"
on storage.objects for insert
to authenticated
with check (bucket_id = 'voice-messages' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Authenticated users can read voice messages" on storage.objects;
create policy "Authenticated users can read voice messages"
on storage.objects for select
to authenticated
using (bucket_id = 'voice-messages');
