create type public.court_status as enum ('available', 'occupied', 'inactive');
create type public.session_status as enum (
  'draft',
  'open',
  'paused',
  'closed',
  'completed'
);
create type public.queue_policy as enum ('fifo');

create table public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.sports (name, slug)
values
  ('Pickleball', 'pickleball'),
  ('Badminton', 'badminton'),
  ('Tennis', 'tennis')
on conflict (slug) do nothing;

create table public.courts (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  sport_id uuid not null references public.sports (id) on delete restrict,
  status public.court_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (facility_id, name),
  unique (id, facility_id, sport_id)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  sport_id uuid not null references public.sports (id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.session_status not null default 'draft',
  players_per_match integer not null check (players_per_match > 0),
  queue_policy public.queue_policy not null default 'fifo',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  unique (id, facility_id, sport_id)
);

create table public.session_courts (
  session_id uuid not null,
  court_id uuid not null,
  facility_id uuid not null,
  sport_id uuid not null,
  primary key (session_id, court_id),
  constraint session_courts_session_facility_sport_fkey
  foreign key (session_id, facility_id, sport_id)
    references public.sessions (id, facility_id, sport_id)
    on delete cascade,
  constraint session_courts_court_facility_sport_fkey
  foreign key (court_id, facility_id, sport_id)
    references public.courts (id, facility_id, sport_id)
    on delete restrict
);

create index courts_facility_id_idx on public.courts (facility_id);
create index sessions_facility_starts_at_idx
  on public.sessions (facility_id, starts_at);
create index sessions_open_starts_at_idx
  on public.sessions (starts_at)
  where status = 'open';
create index session_courts_court_id_idx on public.session_courts (court_id);

create trigger courts_set_updated_at
before update on public.courts
for each row execute function public.set_updated_at();

create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

create function public.validate_facility_timezone()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = new.timezone
  )
  then
    raise exception 'Facility timezone must be a valid IANA timezone';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_facility_timezone()
  from public, anon, authenticated;

create trigger facilities_validate_timezone
before insert or update on public.facilities
for each row execute function public.validate_facility_timezone();

create function public.prevent_unavailable_session_courts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
    and new.status <> 'available'
    and exists (
      select 1
      from public.session_courts as link
      join public.sessions as session on session.id = link.session_id
      where link.court_id = new.id
        and session.status = 'open'
    )
  then
    raise exception 'Close linked open sessions before making a court unavailable';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_unavailable_session_courts()
  from public, anon, authenticated;

create trigger courts_prevent_unavailable_open_session
before update of status on public.courts
for each row execute function public.prevent_unavailable_session_courts();

alter table public.sports enable row level security;
alter table public.courts enable row level security;
alter table public.sessions enable row level security;
alter table public.session_courts enable row level security;

revoke all on public.sports from anon, authenticated;
grant select on public.sports to anon, authenticated;

revoke all on public.courts from anon, authenticated;
grant select on public.courts to anon, authenticated;
grant insert (facility_id, name, sport_id, status)
  on public.courts to authenticated;
grant update (name, sport_id, status) on public.courts to authenticated;
grant delete on public.courts to authenticated;

revoke all on public.sessions from anon, authenticated;
grant select (
  id,
  facility_id,
  sport_id,
  name,
  starts_at,
  ends_at,
  status,
  players_per_match,
  queue_policy,
  created_at,
  updated_at
) on public.sessions to anon, authenticated;

revoke all on public.session_courts from anon, authenticated;
grant select on public.session_courts to anon, authenticated;

revoke select on public.facilities from anon, authenticated;
grant select (id, name, slug, address, timezone)
  on public.facilities to anon, authenticated;

create policy "Anyone can read active sports"
on public.sports
for select
to anon, authenticated
using (is_active);

create policy "Facility admins can create courts"
on public.courts
for insert
to authenticated
with check (
  public.is_facility_member(facility_id, array['admin']::public.facility_role[])
  and exists (
    select 1
    from public.sports
    where sports.id = courts.sport_id
      and sports.is_active
  )
);

create policy "Facility admins can update courts"
on public.courts
for update
to authenticated
using (
  public.is_facility_member(facility_id, array['admin']::public.facility_role[])
)
with check (
  public.is_facility_member(facility_id, array['admin']::public.facility_role[])
  and exists (
    select 1
    from public.sports
    where sports.id = courts.sport_id
      and sports.is_active
  )
);

create policy "Facility admins can delete unassigned courts"
on public.courts
for delete
to authenticated
using (
  public.is_facility_member(facility_id, array['admin']::public.facility_role[])
);

create policy "Facility members can read facility sessions"
on public.sessions
for select
to authenticated
using (
  public.is_facility_member(
    facility_id,
    array['admin', 'staff']::public.facility_role[]
  )
);

create policy "Anyone can read open sessions"
on public.sessions
for select
to anon, authenticated
using (
  status = 'open'
);

create policy "Anyone can read facilities with open sessions"
on public.facilities
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sessions
    where sessions.facility_id = facilities.id
      and sessions.status = 'open'
  )
);

create policy "Facility members can read facility session courts"
on public.session_courts
for select
to authenticated
using (
  public.is_facility_member(
    facility_id,
    array['admin', 'staff']::public.facility_role[]
  )
);

create policy "Anyone can read courts for open sessions"
on public.session_courts
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sessions
    where sessions.id = session_courts.session_id
      and sessions.status = 'open'
  )
);

create policy "Facility members can read facility courts"
on public.courts
for select
to authenticated
using (
  public.is_facility_member(
    facility_id,
    array['admin', 'staff']::public.facility_role[]
  )
);

create policy "Anyone can read courts for open sessions"
on public.courts
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.session_courts
    join public.sessions on sessions.id = session_courts.session_id
    where session_courts.court_id = courts.id
      and sessions.status = 'open'
  )
);

create function public.save_session(
  _session_id uuid,
  _facility_id uuid,
  _sport_id uuid,
  _name text,
  _starts_at_local text,
  _ends_at_local text,
  _status public.session_status,
  _players_per_match integer,
  _queue_policy public.queue_policy,
  _court_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  facility_timezone text;
  start_local timestamp without time zone;
  end_local timestamp without time zone;
  start_time timestamptz;
  end_time timestamptz;
  compatible_court_count integer;
  saved_session_id uuid;
begin
  if current_user_id is null or not public.is_facility_member(
    _facility_id,
    array['admin']::public.facility_role[]
  ) then
    raise exception 'Facility administrator access is required';
  end if;

  if char_length(btrim(coalesce(_name, ''))) not between 1 and 120 then
    raise exception 'Session name must be between 1 and 120 characters';
  end if;

  if _players_per_match is null or _players_per_match < 1 then
    raise exception 'Players per match must be a positive integer';
  end if;

  if _starts_at_local is null
    or _starts_at_local !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$'
    or (
      _ends_at_local is not null
      and _ends_at_local !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$'
    )
  then
    raise exception 'Session times must use the facility local date and time format';
  end if;

  select facility.timezone
  into facility_timezone
  from public.facilities as facility
  where facility.id = _facility_id
  for share;

  if facility_timezone is null
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names
      where name = facility_timezone
    )
  then
    raise exception 'The facility timezone is invalid';
  end if;

  if not exists (
    select 1 from public.sports where id = _sport_id and is_active
  ) then
    raise exception 'Choose an active sport';
  end if;

  start_local := _starts_at_local::timestamp without time zone;
  start_time := start_local at time zone facility_timezone;
  if start_time at time zone facility_timezone <> start_local then
    raise exception 'The session start time does not exist in the facility timezone';
  end if;

  if _ends_at_local is null or btrim(_ends_at_local) = '' then
    end_local := null;
    end_time := null;
  else
    end_local := _ends_at_local::timestamp without time zone;
    end_time := end_local at time zone facility_timezone;
    if end_time at time zone facility_timezone <> end_local then
      raise exception 'The session end time does not exist in the facility timezone';
    end if;
  end if;

  if end_time is not null and end_time <= start_time then
    raise exception 'The session end time must be after its start time';
  end if;

  if cardinality(coalesce(_court_ids, array[]::uuid[]))
    <> cardinality(array(
      select distinct court_id
      from unnest(coalesce(_court_ids, array[]::uuid[])) as ids(court_id)
      where court_id is not null
    ))
  then
    raise exception 'Choose each court only once';
  end if;

  perform court.id
  from public.courts as court
  where court.id = any(coalesce(_court_ids, array[]::uuid[]))
  order by court.id
  for share;

  select count(*)
  into compatible_court_count
  from public.courts as court
  where court.id = any(coalesce(_court_ids, array[]::uuid[]))
    and court.facility_id = _facility_id
    and court.sport_id = _sport_id
    and court.status = 'available';

  if compatible_court_count <> cardinality(
    coalesce(_court_ids, array[]::uuid[])
  ) then
    raise exception 'Choose available courts at this facility for the selected sport';
  end if;

  if _status = 'open' and compatible_court_count = 0 then
    raise exception 'An open session must use at least one active court';
  end if;

  if _session_id is null then
    insert into public.sessions (
      facility_id,
      sport_id,
      name,
      starts_at,
      ends_at,
      status,
      players_per_match,
      queue_policy,
      created_by
    )
    values (
      _facility_id,
      _sport_id,
      btrim(_name),
      start_time,
      end_time,
      _status,
      _players_per_match,
      _queue_policy,
      current_user_id
    )
    returning id into saved_session_id;
  else
    perform 1
    from public.sessions
    where id = _session_id
      and facility_id = _facility_id
    for update;

    if not found then
      raise exception 'The session was not found at this facility';
    end if;

    delete from public.session_courts
    where session_id = _session_id;

    update public.sessions
    set sport_id = _sport_id,
        name = btrim(_name),
        starts_at = start_time,
        ends_at = end_time,
        status = _status,
        players_per_match = _players_per_match,
        queue_policy = _queue_policy
    where id = _session_id
      and facility_id = _facility_id
    returning id into saved_session_id;
  end if;

  insert into public.session_courts (
    session_id,
    court_id,
    facility_id,
    sport_id
  )
  select saved_session_id, court.id, _facility_id, _sport_id
  from public.courts as court
  where court.id = any(coalesce(_court_ids, array[]::uuid[]));

  return saved_session_id;
end;
$$;

revoke all on function public.save_session(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  public.session_status,
  integer,
  public.queue_policy,
  uuid[]
) from public, anon;
grant execute on function public.save_session(
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  public.session_status,
  integer,
  public.queue_policy,
  uuid[]
) to authenticated;
