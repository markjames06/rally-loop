begin;

select plan(8);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'realtime.messages'::regclass
  ),
  'Realtime message authorization uses the existing RLS boundary'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'realtime'
      and tablename = 'messages'
      and policyname =
        'Facility members and signed-in players can receive session updates'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
  ),
  'only authenticated users can join private session update channels'
);

select ok(
  (
    select qual ilike '%session.status = ''open''%'
      and qual ilike '%is_facility_member%'
    from pg_policies
    where schemaname = 'realtime'
      and tablename = 'messages'
      and policyname =
        'Facility members and signed-in players can receive session updates'
  ),
  'open sessions are available to signed-in players and other sessions to staff'
);

select ok(
  to_regprocedure('public.broadcast_session_row_change()') is not null,
  'session row broadcast trigger function exists'
);

select ok(
  to_regprocedure('public.broadcast_court_change()') is not null,
  'court broadcast trigger function exists'
);

select is(
  (
    select count(*)::integer
    from pg_trigger
    where not tgisinternal
      and tgname in (
        'queue_entries_broadcast_session_change',
        'matches_broadcast_session_change',
        'sessions_broadcast_session_change',
        'session_courts_broadcast_session_change',
        'courts_broadcast_session_change'
      )
  ),
  5,
  'queue, session, court-link, court, and match changes broadcast'
);

select ok(
  position(
    '''table''' in pg_get_functiondef(
      'public.broadcast_session_row_change()'::regprocedure
    )
  ) > 0
  and position(
    '''operation''' in pg_get_functiondef(
      'public.broadcast_session_row_change()'::regprocedure
    )
  ) > 0
  and position(
    'player_names' in pg_get_functiondef(
      'public.broadcast_session_row_change()'::regprocedure
    )
  ) = 0
  and position(
    'notes' in pg_get_functiondef(
      'public.broadcast_session_row_change()'::regprocedure
    )
  ) = 0,
  'session broadcasts contain change metadata only, not match details or notes'
);

select ok(
  not has_table_privilege('authenticated', 'public.matches', 'SELECT')
  and not has_table_privilege('authenticated', 'public.match_players', 'SELECT'),
  'Realtime does not grant direct match or match-player access'
);

select * from finish();

rollback;
