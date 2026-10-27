create type public.match_status as enum (
  'assigned',
  'in_progress',
  'completed',
  'cancelled'
);

alter table public.queue_entries
  add constraint queue_entries_match_reference_key
  unique (id, session_id, player_id);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  court_id uuid not null references public.courts (id) on delete restrict,
  status public.match_status not null default 'assigned',
  assigned_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  notes text,
  unique (id, session_id),
  check (
    notes is null
    or char_length(btrim(notes)) between 1 and 500
  ),
  check (
    (
      status = 'assigned'
      and started_at is null
      and completed_at is null
      and cancelled_at is null
    )
    or (
      status = 'in_progress'
      and started_at is not null
      and completed_at is null
      and cancelled_at is null
    )
    or (
      status = 'completed'
      and started_at is not null
      and completed_at is not null
      and cancelled_at is null
    )
    or (
      status = 'cancelled'
      and completed_at is null
      and cancelled_at is not null
    )
  ),
  check (started_at is null or started_at >= assigned_at),
  check (completed_at is null or completed_at >= started_at),
  check (cancelled_at is null or cancelled_at >= assigned_at)
);

create table public.match_players (
  match_id uuid not null,
  session_id uuid not null,
  player_id uuid not null references public.profiles (id) on delete restrict,
  queue_entry_id uuid not null,
  primary key (match_id, player_id),
  foreign key (match_id, session_id)
    references public.matches (id, session_id) on delete cascade,
  foreign key (queue_entry_id, session_id, player_id)
    references public.queue_entries (id, session_id, player_id)
    on delete cascade
);

create unique index matches_one_active_per_court_idx
  on public.matches (court_id)
  where status in ('assigned', 'in_progress');
create index matches_session_history_idx
  on public.matches (session_id, assigned_at desc);
create index match_players_player_id_idx
  on public.match_players (player_id, match_id);

create trigger matches_set_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

alter table public.matches enable row level security;
alter table public.match_players enable row level security;

revoke all on public.matches from anon, authenticated;
revoke all on public.match_players from anon, authenticated;
grant usage on type public.match_status to authenticated;

create or replace function public.prevent_unavailable_session_courts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
    and new.status <> 'available'
  then
    if new.status = 'occupied'
      and exists (
        select 1
        from public.matches as match_row
        where match_row.court_id = new.id
          and match_row.status in ('assigned', 'in_progress')
      )
    then
      return new;
    end if;

    if exists (
      select 1
      from public.session_courts as link
      join public.sessions as session on session.id = link.session_id
      where link.court_id = new.id
        and session.status = 'open'
    )
    then
      raise exception 'Close linked open sessions before making a court unavailable';
    end if;
  end if;

  return new;
end;
$$;

create function public.prevent_active_match_court_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
    and new.status <> 'occupied'
    and exists (
      select 1
      from public.matches as match_row
      where match_row.court_id = old.id
        and match_row.status in ('assigned', 'in_progress')
    )
  then
    raise exception 'A court with an active match cannot be made available or inactive';
  end if;

  return new;
end;
$$;

create trigger courts_prevent_active_match_status_change
before update of status on public.courts
for each row execute function public.prevent_active_match_court_status_change();

create function public.prevent_active_match_session_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.matches as match_row
    where match_row.session_id = old.id
      and match_row.status in ('assigned', 'in_progress')
  ) and (
    new.facility_id is distinct from old.facility_id
    or new.sport_id is distinct from old.sport_id
    or new.players_per_match is distinct from old.players_per_match
    or (
      new.status is distinct from old.status
      and new.status = 'completed'
    )
  )
  then
    raise exception 'Finish or cancel active matches before changing session setup';
  end if;

  return new;
end;
$$;

create trigger sessions_prevent_active_match_setup_changes
before update of facility_id, sport_id, players_per_match, status
on public.sessions
for each row execute function public.prevent_active_match_session_changes();

create function public.prevent_active_match_court_unlink()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.matches as match_row
    where match_row.session_id = old.session_id
      and match_row.court_id = old.court_id
      and match_row.status in ('assigned', 'in_progress')
  )
  then
    raise exception 'Finish or cancel the active match before removing its court from the session';
  end if;

  return old;
end;
$$;

create trigger session_courts_prevent_active_match_unlink
before delete on public.session_courts
for each row execute function public.prevent_active_match_court_unlink();

create or replace function public.join_queue(_session_id uuid)
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

  perform 1
  from public.profiles
  where id = current_user_id
  for update;

  if exists (
    select 1
    from public.match_players as player
    join public.matches as match_row on match_row.id = player.match_id
    where player.player_id = current_user_id
      and match_row.status in ('assigned', 'in_progress')
  ) then
    raise exception 'Finish your active match before joining another queue'
      using errcode = '23514';
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

create function public.assign_next_match(
  _session_id uuid,
  _court_id uuid,
  _notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_facility_id uuid;
  current_session_status public.session_status;
  current_match_size integer;
  current_court_status public.court_status;
  selected_entry_ids uuid[];
  selected_player_ids uuid[];
  new_match_id uuid;
  clean_notes text := nullif(btrim(coalesce(_notes, '')), '');
begin
  if current_user_id is null then
    raise exception 'Sign in before assigning a match'
      using errcode = '42501';
  end if;

  select session.facility_id
  into current_facility_id
  from public.sessions as session
  where session.id = _session_id;

  if not found then
    raise exception 'Session was not found';
  end if;
  if not public.is_facility_member(
    current_facility_id,
    array['admin', 'staff']::public.facility_role[]
  ) then
    raise exception 'Facility staff access is required to assign a match'
      using errcode = '42501';
  end if;
  if char_length(coalesce(clean_notes, '')) > 500 then
    raise exception 'Match notes cannot exceed 500 characters';
  end if;

  select court.status
  into current_court_status
  from public.courts as court
  where court.id = _court_id
  for update;

  if not found then
    raise exception 'Court was not found';
  end if;

  select session.status, session.players_per_match
  into current_session_status, current_match_size
  from public.sessions as session
  where session.id = _session_id
  for update;

  if not found or current_session_status <> 'open' then
    raise exception 'Matches can only be assigned in an open session';
  end if;

  if not exists (
    select 1
    from public.session_courts as link
    where link.session_id = _session_id
      and link.court_id = _court_id
  ) then
    raise exception 'Choose a court assigned to this session';
  end if;
  if current_court_status <> 'available' then
    raise exception 'Choose an available court';
  end if;

  select
    array_agg(candidate.entry_id order by candidate.joined_at, candidate.entry_id),
    array_agg(candidate.player_id order by candidate.joined_at, candidate.entry_id)
  into selected_entry_ids, selected_player_ids
  from (
    select entry.id as entry_id, entry.player_id, entry.joined_at
    from public.queue_entries as entry
    where entry.session_id = _session_id
      and entry.status = 'waiting'
      and not exists (
        select 1
        from public.match_players as match_player
        join public.matches as active_match
          on active_match.id = match_player.match_id
        where match_player.player_id = entry.player_id
          and active_match.status in ('assigned', 'in_progress')
      )
    order by entry.joined_at, entry.id
    limit current_match_size
    for update of entry
  ) as candidate;

  if coalesce(cardinality(selected_entry_ids), 0) <> current_match_size then
    raise exception 'Not enough eligible waiting players to fill this match';
  end if;

  perform profile.id
  from public.profiles as profile
  where profile.id = any(selected_player_ids)
  order by profile.id
  for update;

  if exists (
    select 1
    from public.match_players as match_player
    join public.matches as active_match
      on active_match.id = match_player.match_id
    where match_player.player_id = any(selected_player_ids)
      and active_match.status in ('assigned', 'in_progress')
  ) then
    raise exception 'A selected player has an active match; refresh and assign again';
  end if;

  insert into public.matches (
    session_id,
    court_id,
    status,
    created_by,
    notes
  )
  values (
    _session_id,
    _court_id,
    'assigned',
    current_user_id,
    clean_notes
  )
  returning id into new_match_id;

  insert into public.match_players (
    match_id,
    session_id,
    player_id,
    queue_entry_id
  )
  select new_match_id, _session_id, entry.player_id, entry.id
  from public.queue_entries as entry
  where entry.id = any(selected_entry_ids);

  update public.queue_entries
  set status = 'assigned',
      handled_by = current_user_id
  where id = any(selected_entry_ids);

  update public.courts
  set status = 'occupied'
  where id = _court_id;

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
    'match_assigned',
    'match',
    new_match_id,
    jsonb_build_object(
      'session_id', _session_id,
      'court_id', _court_id,
      'queue_entry_ids', selected_entry_ids
    )
  );

  return new_match_id;
end;
$$;

create function public.start_match(_session_id uuid, _match_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_facility_id uuid;
  current_session_status public.session_status;
  current_match_status public.match_status;
begin
  if current_user_id is null then
    raise exception 'Sign in before starting a match'
      using errcode = '42501';
  end if;

  select session.facility_id
  into current_facility_id
  from public.sessions as session
  where session.id = _session_id;

  if not found then
    raise exception 'Session was not found';
  end if;
  if not public.is_facility_member(
    current_facility_id,
    array['admin', 'staff']::public.facility_role[]
  ) then
    raise exception 'Facility staff access is required to start a match'
      using errcode = '42501';
  end if;

  select session.status
  into current_session_status
  from public.sessions as session
  where session.id = _session_id
  for update;

  if not found or current_session_status not in ('open', 'paused') then
    raise exception 'A match can only start while the session is open or paused';
  end if;

  select match_row.status
  into current_match_status
  from public.matches as match_row
  where match_row.id = _match_id
    and match_row.session_id = _session_id
  for update;

  if not found then
    raise exception 'Match was not found in this session';
  end if;
  if current_match_status <> 'assigned' then
    raise exception 'Only an assigned match can be started';
  end if;

  update public.matches
  set status = 'in_progress',
      started_at = clock_timestamp()
  where id = _match_id;

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
    'match_started',
    'match',
    _match_id,
    jsonb_build_object('session_id', _session_id)
  );

  return _match_id;
end;
$$;

create function public.complete_match(
  _session_id uuid,
  _match_id uuid,
  _notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_facility_id uuid;
  current_court_id uuid;
  current_match_status public.match_status;
  clean_notes text := nullif(btrim(coalesce(_notes, '')), '');
  updated_queue_count integer;
  match_player_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in before completing a match'
      using errcode = '42501';
  end if;

  select session.facility_id
  into current_facility_id
  from public.sessions as session
  where session.id = _session_id;

  if not found then
    raise exception 'Session was not found';
  end if;
  if not public.is_facility_member(
    current_facility_id,
    array['admin', 'staff']::public.facility_role[]
  ) then
    raise exception 'Facility staff access is required to complete a match'
      using errcode = '42501';
  end if;
  if char_length(coalesce(clean_notes, '')) > 500 then
    raise exception 'Match notes cannot exceed 500 characters';
  end if;

  select match_row.court_id
  into current_court_id
  from public.matches as match_row
  where match_row.id = _match_id
    and match_row.session_id = _session_id;

  if not found then
    raise exception 'Match was not found in this session';
  end if;

  perform 1
  from public.courts
  where id = current_court_id
  for update;
  if not found then
    raise exception 'The match court could not be found';
  end if;

  perform 1
  from public.sessions
  where id = _session_id
  for update;
  if not found then
    raise exception 'Session was not found';
  end if;

  select match_row.status
  into current_match_status
  from public.matches as match_row
  where match_row.id = _match_id
    and match_row.session_id = _session_id
  for update;

  if not found then
    raise exception 'Match was not found in this session';
  end if;
  if current_match_status <> 'in_progress' then
    raise exception 'Only an in-progress match can be completed';
  end if;

  update public.matches
  set status = 'completed',
      completed_at = clock_timestamp(),
      notes = coalesce(clean_notes, notes)
  where id = _match_id;

  update public.queue_entries as entry
  set status = 'played'
  from public.match_players as match_player
  where match_player.match_id = _match_id
    and entry.id = match_player.queue_entry_id
    and entry.status = 'assigned';
  get diagnostics updated_queue_count = row_count;

  select count(*)
  into match_player_count
  from public.match_players
  where match_id = _match_id;

  if updated_queue_count <> match_player_count then
    raise exception 'Match queue entries changed unexpectedly; no changes were saved';
  end if;

  update public.courts
  set status = 'available'
  where id = current_court_id;
  if not found then
    raise exception 'The match court could not be released';
  end if;

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
    'match_completed',
    'match',
    _match_id,
    jsonb_build_object(
      'session_id', _session_id,
      'court_id', current_court_id,
      'player_count', match_player_count
    )
  );

  return _match_id;
end;
$$;

create function public.cancel_match(
  _session_id uuid,
  _match_id uuid,
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
  current_court_id uuid;
  current_match_status public.match_status;
  clean_reason text := btrim(coalesce(_reason, ''));
  updated_queue_count integer;
  match_player_count integer;
begin
  if current_user_id is null then
    raise exception 'Sign in before cancelling a match'
      using errcode = '42501';
  end if;

  select session.facility_id
  into current_facility_id
  from public.sessions as session
  where session.id = _session_id;

  if not found then
    raise exception 'Session was not found';
  end if;
  if not public.is_facility_member(
    current_facility_id,
    array['admin', 'staff']::public.facility_role[]
  ) then
    raise exception 'Facility staff access is required to cancel a match'
      using errcode = '42501';
  end if;
  if char_length(clean_reason) not between 3 and 500 then
    raise exception 'Enter a cancellation reason between 3 and 500 characters';
  end if;

  select match_row.court_id
  into current_court_id
  from public.matches as match_row
  where match_row.id = _match_id
    and match_row.session_id = _session_id;

  if not found then
    raise exception 'Match was not found in this session';
  end if;

  perform 1
  from public.courts
  where id = current_court_id
  for update;
  if not found then
    raise exception 'The match court could not be found';
  end if;

  perform 1
  from public.sessions
  where id = _session_id
  for update;
  if not found then
    raise exception 'Session was not found';
  end if;

  select match_row.status
  into current_match_status
  from public.matches as match_row
  where match_row.id = _match_id
    and match_row.session_id = _session_id
  for update;

  if not found then
    raise exception 'Match was not found in this session';
  end if;
  if current_match_status not in ('assigned', 'in_progress') then
    raise exception 'Only an active match can be cancelled';
  end if;

  update public.matches
  set status = 'cancelled',
      cancelled_at = clock_timestamp()
  where id = _match_id;

  update public.queue_entries as entry
  set status = 'waiting',
      handled_by = current_user_id
  from public.match_players as match_player
  where match_player.match_id = _match_id
    and entry.id = match_player.queue_entry_id
    and entry.status = 'assigned';
  get diagnostics updated_queue_count = row_count;

  select count(*)
  into match_player_count
  from public.match_players
  where match_id = _match_id;

  if updated_queue_count <> match_player_count then
    raise exception 'Match queue entries changed unexpectedly; no changes were saved';
  end if;

  update public.courts
  set status = 'available'
  where id = current_court_id;
  if not found then
    raise exception 'The match court could not be released';
  end if;

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
    'match_cancelled',
    'match',
    _match_id,
    jsonb_build_object(
      'session_id', _session_id,
      'court_id', current_court_id,
      'reason', clean_reason
    )
  );

  return _match_id;
end;
$$;

create function public.get_session_matches(_session_id uuid)
returns table (
  match_id uuid,
  court_id uuid,
  court_name text,
  status public.match_status,
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  player_names text[]
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
    raise exception 'Sign in to view match details'
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
    raise exception 'Match details are only available for open sessions'
      using errcode = '42501';
  end if;

  return query
  select
    match_row.id,
    match_row.court_id,
    court.name,
    match_row.status,
    match_row.assigned_at,
    match_row.started_at,
    match_row.completed_at,
    match_row.cancelled_at,
    case when can_manage then match_row.notes else null end,
    coalesce(
      array_agg(profile.display_name order by profile.display_name)
        filter (where profile.id is not null),
      array[]::text[]
    )
  from public.matches as match_row
  join public.courts as court on court.id = match_row.court_id
  left join public.match_players as match_player on match_player.match_id = match_row.id
  left join public.profiles as profile on profile.id = match_player.player_id
  where match_row.session_id = _session_id
  group by match_row.id, court.name
  order by
    case when match_row.status in ('assigned', 'in_progress') then 0 else 1 end,
    match_row.assigned_at desc
  limit 50;
end;
$$;

create function public.get_my_match_history()
returns table (
  match_id uuid,
  session_id uuid,
  session_name text,
  facility_name text,
  facility_timezone text,
  court_name text,
  status public.match_status,
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  player_names text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Sign in to view match history'
      using errcode = '42501';
  end if;

  return query
  select
    match_row.id,
    match_row.session_id,
    session.name,
    facility.name,
    facility.timezone,
    court.name,
    match_row.status,
    match_row.assigned_at,
    match_row.started_at,
    match_row.completed_at,
    match_row.cancelled_at,
    coalesce(
      array_agg(profile.display_name order by profile.display_name)
        filter (where profile.id is not null),
      array[]::text[]
    )
  from public.match_players as own_match_player
  join public.matches as match_row on match_row.id = own_match_player.match_id
  join public.sessions as session on session.id = match_row.session_id
  join public.facilities as facility on facility.id = session.facility_id
  join public.courts as court on court.id = match_row.court_id
  join public.match_players as match_player on match_player.match_id = match_row.id
  join public.profiles as profile on profile.id = match_player.player_id
  where own_match_player.player_id = current_user_id
  group by
    match_row.id,
    session.name,
    facility.name,
    facility.timezone,
    court.name
  order by match_row.assigned_at desc
  limit 50;
end;
$$;

revoke all on function public.prevent_active_match_court_status_change()
  from public, anon, authenticated;
revoke all on function public.prevent_active_match_session_changes()
  from public, anon, authenticated;
revoke all on function public.prevent_active_match_court_unlink()
  from public, anon, authenticated;
revoke all on function public.join_queue(uuid) from public, anon;
revoke all on function public.assign_next_match(uuid, uuid, text)
  from public, anon;
revoke all on function public.start_match(uuid, uuid) from public, anon;
revoke all on function public.complete_match(uuid, uuid, text)
  from public, anon;
revoke all on function public.cancel_match(uuid, uuid, text)
  from public, anon;
revoke all on function public.get_session_matches(uuid) from public, anon;
revoke all on function public.get_my_match_history() from public, anon;

grant execute on function public.join_queue(uuid) to authenticated;
grant execute on function public.assign_next_match(uuid, uuid, text)
  to authenticated;
grant execute on function public.start_match(uuid, uuid) to authenticated;
grant execute on function public.complete_match(uuid, uuid, text)
  to authenticated;
grant execute on function public.cancel_match(uuid, uuid, text)
  to authenticated;
grant execute on function public.get_session_matches(uuid) to authenticated;
grant execute on function public.get_my_match_history() to authenticated;
