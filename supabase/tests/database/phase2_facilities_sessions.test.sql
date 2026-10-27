begin;

select plan(34);

select has_table('public', 'sports', 'sports table exists');
select has_table('public', 'courts', 'courts table exists');
select has_table('public', 'sessions', 'sessions table exists');
select has_table('public', 'session_courts', 'session_courts table exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.sports'::regclass),
  'sports has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.courts'::regclass),
  'courts has row level security enabled'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.sessions'::regclass
  ),
  'sessions has row level security enabled'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.session_courts'::regclass
  ),
  'session_courts has row level security enabled'
);

select ok(
  (
    select count(*) = 3
    from public.sports
    where slug in ('pickleball', 'badminton', 'tennis')
  ),
  'the initial three sports are seeded'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sports'
      and policyname = 'Anyone can read active sports'
  ),
  'only active sports are exposed through the public read policy'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'courts'
      and policyname = 'Facility admins can create courts'
      and with_check like '%is_facility_member%'
  ),
  'court creation requires facility administrator membership'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'courts'
      and policyname = 'Facility admins can create courts'
      and with_check like '%is_active%'
  ),
  'courts can only use active sports'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'courts'
      and policyname = 'Facility admins can update courts'
      and qual like '%is_facility_member%'
      and with_check like '%is_facility_member%'
  ),
  'court updates require facility administrator membership'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'courts'
      and policyname = 'Facility admins can delete unassigned courts'
      and qual like '%is_facility_member%'
  ),
  'court deletion requires facility administrator membership'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'Anyone can read open sessions'
      and qual like '%open%'
      and 'anon' = any (roles::text[])
  ),
  'anonymous players can read open sessions'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'Facility members can read facility sessions'
      and qual like '%is_facility_member%'
  ),
  'facility staff can read their private session states'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'facilities'
      and policyname = 'Anyone can read facilities with open sessions'
  ),
  'public facility reads are limited to facilities with open sessions'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'courts'
      and policyname = 'Anyone can read courts for open sessions'
      and qual like '%open%'
  ),
  'public court reads are limited to courts linked to open sessions'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'session_courts'
      and policyname = 'Anyone can read courts for open sessions'
      and qual like '%open%'
  ),
  'public session-court links are limited to open sessions'
);

select ok(
  to_regprocedure(
    'public.save_session(uuid,uuid,uuid,text,text,text,public.session_status,integer,public.queue_policy,uuid[])'
  ) is not null,
  'the transactional session save function exists'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.save_session(uuid,uuid,uuid,text,text,text,public.session_status,integer,public.queue_policy,uuid[])',
    'execute'
  ),
  'anonymous users cannot save sessions'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.save_session(uuid,uuid,uuid,text,text,text,public.session_status,integer,public.queue_policy,uuid[])',
    'execute'
  ),
  'authenticated users can invoke the role-checked session save function'
);

select ok(
  has_column_privilege('anon', 'public.sessions', 'status', 'SELECT'),
  'anonymous API users can read session status'
);
select ok(
  not has_table_privilege('authenticated', 'public.sessions', 'INSERT'),
  'authenticated users cannot bypass the transactional session save function'
);
select ok(
  has_column_privilege('authenticated', 'public.courts', 'facility_id', 'INSERT'),
  'authenticated court inserts are available to RLS checks'
);
select ok(
  has_column_privilege('authenticated', 'public.courts', 'sport_id', 'UPDATE'),
  'administrators can update court sports when foreign keys permit'
);
select ok(
  not has_table_privilege('authenticated', 'public.session_courts', 'INSERT'),
  'session court links cannot be changed outside the session transaction'
);
select ok(
  has_column_privilege('anon', 'public.facilities', 'name', 'SELECT'),
  'anonymous users can fetch facility details for open sessions'
);
select ok(
  not has_column_privilege(
    'anon',
    'public.sessions',
    'created_by',
    'SELECT'
  ),
  'public session reads do not expose the creator profile id'
);
select ok(
  not has_column_privilege(
    'anon',
    'public.facilities',
    'created_by',
    'SELECT'
  ),
  'public facility reads do not expose the creator profile id'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conname = 'session_courts_session_facility_sport_fkey'
      and conrelid = 'public.session_courts'::regclass
  )
  and exists (
    select 1
    from pg_constraint
    where conname = 'session_courts_court_facility_sport_fkey'
      and conrelid = 'public.session_courts'::regclass
  ),
  'court links enforce matching facility and sport foreign keys'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%ends_at%'
  ),
  'session end time must be after its start time'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'courts_prevent_unavailable_open_session'
      and tgrelid = 'public.courts'::regclass
      and not tgisinternal
  ),
  'courts linked to open sessions cannot be made unavailable'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'facilities_validate_timezone'
      and tgrelid = 'public.facilities'::regclass
      and not tgisinternal
  ),
  'facility timezone values are validated in the database'
);

select * from finish();

rollback;
