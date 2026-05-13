create or replace function public.create_group_conversation(
  group_name text,
  group_description text default null,
  group_image_url text default null,
  member_ids uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  creator uuid := auth.uid();
  clean_name text := nullif(trim(group_name), '');
  new_conversation_id uuid;
  member_id uuid;
  unique_member_ids uuid[];
begin
  if creator is null then
    raise exception 'Authentication required';
  end if;

  if clean_name is null then
    raise exception 'Group name is required';
  end if;

  select coalesce(array_agg(distinct value), '{}')
  into unique_member_ids
  from unnest(member_ids) as value
  where value is not null and value <> creator;

  if coalesce(array_length(unique_member_ids, 1), 0) = 0 then
    raise exception 'Choose at least one accepted friend';
  end if;

  foreach member_id in array unique_member_ids loop
    if not public.are_friends(creator, member_id) then
      raise exception 'Only accepted friends can be added to groups';
    end if;
  end loop;

  insert into public.conversations (type, name, description, image_url, created_by)
  values ('group', clean_name, nullif(trim(group_description), ''), nullif(trim(group_image_url), ''), creator)
  returning id into new_conversation_id;

  insert into public.groups (id, name, description, image_url, created_by)
  values (new_conversation_id, clean_name, nullif(trim(group_description), ''), nullif(trim(group_image_url), ''), creator);

  insert into public.conversation_members (conversation_id, user_id, role)
  values (new_conversation_id, creator, 'owner')
  on conflict do nothing;

  insert into public.group_members (group_id, user_id, role)
  values (new_conversation_id, creator, 'owner')
  on conflict do nothing;

  foreach member_id in array unique_member_ids loop
    insert into public.conversation_members (conversation_id, user_id, role)
    values (new_conversation_id, member_id, 'member')
    on conflict do nothing;

    insert into public.group_members (group_id, user_id, role)
    values (new_conversation_id, member_id, 'member')
    on conflict do nothing;

    perform public.notify_user(
      member_id,
      creator,
      'added_to_group',
      'Added to group',
      'You were added to ' || clean_name || '.',
      'conversation',
      new_conversation_id
    );
  end loop;

  return new_conversation_id;
end;
$$;

grant execute on function public.create_group_conversation(text, text, text, uuid[]) to authenticated;
