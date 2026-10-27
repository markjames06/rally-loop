create function public.broadcast_session_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_session_id uuid;
  old_session_id uuid;
begin
  if tg_op <> 'DELETE' then
    new_session_id := (to_jsonb(new) ->> tg_argv[0])::uuid;
  end if;
  if tg_op <> 'INSERT' then
    old_session_id := (to_jsonb(old) ->> tg_argv[0])::uuid;
  end if;

  if new_session_id is not null then
    perform realtime.send(
      jsonb_build_object(
        'table', tg_table_name,
        'operation', tg_op
      ),
      'session_changed',
      'session:' || new_session_id::text,
      true
    );
  end if;
  if old_session_id is not null
    and old_session_id is distinct from new_session_id
  then
    perform realtime.send(
      jsonb_build_object(
        'table', tg_table_name,
        'operation', tg_op
      ),
      'session_changed',
      'session:' || old_session_id::text,
      true
    );
  end if;

  return null;
end;
$$;

create function public.broadcast_court_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed_court_id uuid;
  target_session_id uuid;
begin
  if tg_op = 'DELETE' then
    changed_court_id := old.id;
  else
    changed_court_id := new.id;
  end if;

  for target_session_id in
    select link.session_id
    from public.session_courts as link
    where link.court_id = changed_court_id
  loop
    perform realtime.send(
      jsonb_build_object(
        'table', tg_table_name,
        'operation', tg_op
      ),
      'session_changed',
      'session:' || target_session_id::text,
      true
    );
  end loop;

  return null;
end;
$$;

create trigger queue_entries_broadcast_session_change
after insert or update or delete on public.queue_entries
for each row execute function public.broadcast_session_row_change('session_id');

create trigger matches_broadcast_session_change
after insert or update or delete on public.matches
for each row execute function public.broadcast_session_row_change('session_id');

create trigger sessions_broadcast_session_change
after insert or update or delete on public.sessions
for each row execute function public.broadcast_session_row_change('id');

create trigger session_courts_broadcast_session_change
after insert or update or delete on public.session_courts
for each row execute function public.broadcast_session_row_change('session_id');

create trigger courts_broadcast_session_change
after insert or update or delete on public.courts
for each row execute function public.broadcast_court_change();

revoke all on function public.broadcast_session_row_change() from public, anon, authenticated;
revoke all on function public.broadcast_court_change() from public, anon, authenticated;

create policy "Facility members and signed-in players can receive session updates"
on realtime.messages
for select
to authenticated
using (
  case
    when (select realtime.topic()) ~*
      '^session:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then exists (
      select 1
      from public.sessions as session
      where session.id = substring((select realtime.topic()) from 9)::uuid
        and (
          session.status = 'open'
          or public.is_facility_member(
            session.facility_id,
            array['admin', 'staff']::public.facility_role[]
          )
        )
    )
    else false
  end
);
