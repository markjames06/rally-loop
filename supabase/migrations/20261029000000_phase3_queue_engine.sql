create type public.queue_entry_status as enum (
  'waiting',
  'assigned',
  'withdrawn',
  'skipped'
);

create table public.queue_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  status public.queue_entry_status not null default 'waiting',
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_by uuid references public.profiles (id) on delete set null,
  admin_note text,
  check (
    admin_note is null
    or char_length(btrim(admin_note)) between 3 and 500
  )
);

create unique index queue_entries_one_active_per_player_session_idx
  on public.queue_entries (session_id, player_id)
  where status in ('waiting', 'assigned');
create index queue_entries_waiting_fifo_idx
  on public.queue_entries (session_id, joined_at, id)
  where status = 'waiting';
create index queue_entries_player_history_idx
  on public.queue_entries (player_id, session_id, joined_at desc);

create trigger queue_entries_set_updated_at
before update on public.queue_entries
for each row execute function public.set_updated_at();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (char_length(btrim(action)) between 1 and 80),
  entity_type text not null check (char_length(btrim(entity_type)) between 1 and 80),
  entity_id uuid not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_facility_created_at_idx
  on public.audit_logs (facility_id, created_at desc);

alter table public.queue_entries enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.queue_entries from anon, authenticated;
grant select on public.queue_entries to authenticated;
grant usage on type public.queue_entry_status to authenticated;

revoke all on public.audit_logs from anon, authenticated;
grant select on public.audit_logs to authenticated;

create policy "Players can read their own queue entries"
on public.queue_entries
for select
to authenticated
using ((select auth.uid()) = player_id);

create policy "Facility staff can read session queue entries"
on public.queue_entries
for select
to authenticated
using (
  exists (
    select 1
    from public.sessions
    where sessions.id = queue_entries.session_id
      and public.is_facility_member(
        sessions.facility_id,
        array['admin', 'staff']::public.facility_role[]
      )
  )
);

create policy "Facility admins can read queue audit logs"
on public.audit_logs
for select
to authenticated
using (
  public.is_facility_member(
    facility_id,
    array['admin']::public.facility_role[]
  )
);

create function public.join_queue(_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  session_status public.session_status;
  new_entry_id uuid;
begin
  if current_user_id is null then
    raise exception 'Sign in before joining a queue'
      using errcode = '42501';
  end if;

  select session.status
  into session_status
  from public.sessions as session
  where session.id = _session_id
  for update;

  if not found then
    raise exception 'Session was not found';
  end if;
  if session_status <> 'open' then
    raise exception 'This session is not open for queue joins';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
  ) then
    raise exception 'A RallyLoop profile is required to join a queue';
  end if;

  if exists (
    select 1
    from public.queue_entries
    where session_id = _session_id
      and player_id = current_user_id
      and status in ('waiting', 'assigned')
  ) then
    raise exception 'You already have an active place in this queue'
      using errcode = '23505';
  end if;

  insert into public.queue_entries (session_id, player_id, status, joined_at)
  values (_session_id, current_user_id, 'waiting', clock_timestamp())
  returning id into new_entry_id;

  return new_entry_id;
exception
  when unique_violation then
    raise exception 'You already have an active place in this queue'
      using errcode = '23505';
end;
$$;

create function public.leave_queue(_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  entry_id uuid;
  entry_status public.queue_entry_status;
begin
  if current_user_id is null then
    raise exception 'Sign in before leaving a queue'
      using errcode = '42501';
  end if;

  perform 1
  from public.sessions
  where id = _session_id
  for update;

  if not found then
    raise exception 'Session was not found';
  end if;

  select entry.id, entry.status
  into entry_id, entry_status
  from public.queue_entries as entry
  where entry.session_id = _session_id
    and entry.player_id = current_user_id
    and entry.status in ('waiting', 'assigned')
  for update;

  if not found then
    raise exception 'You do not have an active queue place in this session';
  end if;
  if entry_status <> 'waiting' then
    raise exception 'Only a waiting queue entry can be withdrawn';
  end if;

  update public.queue_entries
  set status = 'withdrawn'
  where id = entry_id;

  return entry_id;
end;
$$;

create function public.get_session_queue(_session_id uuid)
returns table (
  entry_id uuid,
  player_name text,
  queue_position bigint,
  joined_at timestamptz,
  is_current_user boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_session_status public.session_status;
  current_facility_id uuid;
  can_manage boolean;
begin
  if current_user_id is null then
    raise exception 'Sign in to view the session queue'
      using errcode = '42501';
  end if;

  select session.status, session.facility_id
  into current_session_status, current_facility_id
  from public.sessions as session
  where session.id = _session_id;

  if not found then
    raise exception 'Session was not found';
  end if;

  can_manage := public.is_facility_member(
    current_facility_id,
    array['admin', 'staff']::public.facility_role[]
  );
  if current_session_status <> 'open' and not can_manage then
    raise exception 'The session queue is only visible while the session is open'
      using errcode = '42501';
  end if;

  return query
  select
    entry.id,
    profile.display_name,
    row_number() over (order by entry.joined_at, entry.id),
    entry.joined_at,
    entry.player_id = current_user_id
  from public.queue_entries as entry
  join public.profiles as profile on profile.id = entry.player_id
  where entry.session_id = _session_id
    and entry.status = 'waiting'
  order by entry.joined_at, entry.id;
end;
$$;

create function public.skip_queue_entry(
  _session_id uuid,
  _entry_id uuid,
  _reason text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_facility_id uuid;
  entry_status public.queue_entry_status;
begin
  if current_user_id is null then
    raise exception 'Sign in before managing a queue'
      using errcode = '42501';
  end if;

  select session.facility_id
  into current_facility_id
  from public.sessions as session
  where session.id = _session_id
  for update;

  if not found then
    raise exception 'Session was not found';
  end if;

  if not public.is_facility_member(
    current_facility_id,
    array['admin', 'staff']::public.facility_role[]
  ) then
    raise exception 'Facility staff access is required to skip a queue entry'
      using errcode = '42501';
  end if;

  if char_length(btrim(coalesce(_reason, ''))) not between 3 and 500 then
    raise exception 'Enter a reason between 3 and 500 characters';
  end if;

  select entry.status
  into entry_status
  from public.queue_entries as entry
  where entry.id = _entry_id
    and entry.session_id = _session_id
  for update;

  if not found then
    raise exception 'Queue entry was not found in this session';
  end if;
  if entry_status <> 'waiting' then
    raise exception 'Only a waiting queue entry can be skipped';
  end if;

  update public.queue_entries
  set status = 'skipped',
      handled_by = current_user_id,
      admin_note = btrim(_reason)
  where id = _entry_id;

  insert into public.audit_logs (
    facility_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    details
  )
  values (
    current_facility_id,
    current_user_id,
    'queue_entry_skipped',
    'queue_entry',
    _entry_id,
    jsonb_build_object(
      'session_id', _session_id,
      'reason', btrim(_reason)
    )
  );

  return _entry_id;
end;
$$;

revoke all on function public.join_queue(uuid) from public, anon;
revoke all on function public.leave_queue(uuid) from public, anon;
revoke all on function public.get_session_queue(uuid) from public, anon;
revoke all on function public.skip_queue_entry(uuid, uuid, text) from public, anon;

grant execute on function public.join_queue(uuid) to authenticated;
grant execute on function public.leave_queue(uuid) to authenticated;
grant execute on function public.get_session_queue(uuid) to authenticated;
grant execute on function public.skip_queue_entry(uuid, uuid, text)
  to authenticated;
