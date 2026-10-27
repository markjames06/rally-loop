begin;

select plan(39);

select has_table('public', 'matches', 'matches table exists');
select has_table('public', 'match_players', 'match_players table exists');
select has_column(
  'public',
  'matches',
  'updated_at',
  'matches have the timestamp required by their update trigger'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.matches'::regclass
  ),
  'matches have row level security enabled'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.match_players'::regclass
  ),
  'match players have row level security enabled'
);
select ok(
  (
    select array_agg(enumlabel order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.match_status'::regtype
  ) = array['assigned', 'in_progress', 'completed', 'cancelled']::text[],
  'match status enum includes the complete lifecycle'
);
select ok(
  exists (
    select 1
    from pg_enum
    where enumtypid = 'public.queue_entry_status'::regtype
      and enumlabel = 'played'
  ),
  'completed match players have a terminal played queue state'
);
select ok(
  exists (
    select 1
    from pg_index
    where indexrelid = 'public.matches_one_active_per_court_idx'::regclass
      and pg_get_expr(indpred, indrelid) like '%assigned%'
      and pg_get_expr(indpred, indrelid) like '%in_progress%'
  ),
  'a partial unique index prevents two active matches on one court'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.queue_entries'::regclass
      and conname = 'queue_entries_match_reference_key'
      and contype = 'u'
  ),
  'queue entries have a composite match reference key'
);
select ok(
  (
    select count(*) = 2
    from pg_constraint
    where conrelid = 'public.match_players'::regclass
      and contype = 'f'
  ),
  'match players reference both their match and matching queue entry'
);
select ok(
  exists (
    select 1
    from pg_index
    where indexrelid = 'public.matches_session_history_idx'::regclass
  ),
  'matches are indexed for session history'
);

select ok(
  not has_table_privilege('authenticated', 'public.matches', 'SELECT')
  and not has_table_privilege('authenticated', 'public.matches', 'INSERT')
  and not has_table_privilege('authenticated', 'public.matches', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.matches', 'DELETE'),
  'clients cannot read or mutate match rows directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.match_players', 'SELECT')
  and not has_table_privilege('authenticated', 'public.match_players', 'INSERT')
  and not has_table_privilege('authenticated', 'public.match_players', 'UPDATE')
  and not has_table_privilege('authenticated', 'public.match_players', 'DELETE'),
  'clients cannot read or mutate match-player rows directly'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'courts_prevent_active_match_status_change'
      and tgrelid = 'public.courts'::regclass
      and not tgisinternal
  )
  and position(
    'match_row.status in (''assigned'', ''in_progress'')'
    in lower(pg_get_functiondef(
      'public.prevent_unavailable_session_courts()'::regprocedure
    ))
  ) > 0,
  'active matches prevent manual court release or deactivation'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'sessions_prevent_active_match_setup_changes'
      and tgrelid = 'public.sessions'::regclass
      and not tgisinternal
  ),
  'active matches protect session setup from incompatible edits'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'session_courts_prevent_active_match_unlink'
      and tgrelid = 'public.session_courts'::regclass
      and not tgisinternal
  ),
  'active matches prevent their court from being unlinked'
);

select ok(
  to_regprocedure('public.assign_next_match(uuid,uuid,text)') is not null,
  'the atomic next-match assignment function exists'
);
select ok(
  to_regprocedure('public.start_match(uuid,uuid)') is not null,
  'the start-match function exists'
);
select ok(
  to_regprocedure('public.complete_match(uuid,uuid,text)') is not null,
  'the complete-match function exists'
);
select ok(
  to_regprocedure('public.cancel_match(uuid,uuid,text)') is not null,
  'the cancel-match function exists'
);
select ok(
  to_regprocedure('public.get_session_matches(uuid)') is not null,
  'the scoped session match history function exists'
);
select ok(
  to_regprocedure('public.get_my_match_history()') is not null,
  'the caller-only match history function exists'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.assign_next_match(uuid,uuid,text)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.assign_next_match(uuid,uuid,text)',
    'EXECUTE'
  ),
  'only authenticated users can call the staff-checked assignment function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.start_match(uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated users can invoke the staff-checked start function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.complete_match(uuid,uuid,text)',
    'EXECUTE'
  ),
  'authenticated users can invoke the staff-checked completion function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.cancel_match(uuid,uuid,text)',
    'EXECUTE'
  ),
  'authenticated users can invoke the staff-checked cancellation function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.get_session_matches(uuid)',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.get_session_matches(uuid)',
    'EXECUTE'
  ),
  'authenticated users can call scoped match history but anonymous users cannot'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.get_my_match_history()',
    'EXECUTE'
  )
  and not has_function_privilege(
    'anon',
    'public.get_my_match_history()',
    'EXECUTE'
  ),
  'only authenticated users can call personal match history'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.assign_next_match(uuid,uuid,text)'::regprocedure
  )
  and (
    select prosecdef
    from pg_proc
    where oid = 'public.start_match(uuid,uuid)'::regprocedure
  )
  and (
    select prosecdef
    from pg_proc
    where oid = 'public.complete_match(uuid,uuid,text)'::regprocedure
  )
  and (
    select prosecdef
    from pg_proc
    where oid = 'public.cancel_match(uuid,uuid,text)'::regprocedure
  ),
  'match mutations execute through restricted security-definer functions'
);
select ok(
  position(
    'order by entry.joined_at, entry.id'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.start_match(uuid,uuid)'::regprocedure))
  ) > 0,
  'assignment selects FIFO queue entries and locks lifecycle rows'
);
select ok(
  position(
    'for update'
    in lower(pg_get_functiondef(
      'public.join_queue(uuid)'::regprocedure
    ))
  ) > 0
  and position(
    'active match'
    in lower(pg_get_functiondef(
      'public.join_queue(uuid)'::regprocedure
    ))
  ) > 0,
  'queue joins serialize with assignments and reject players in active matches'
);
select ok(
  position(
    'insert into public.match_players'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'update public.queue_entries'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'update public.courts'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'assignment creates match players and updates queue and court atomically'
);
select ok(
  position(
    'insert into public.audit_logs'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'match_assigned'
    in lower(pg_get_functiondef(
      'public.assign_next_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'match assignment writes an audit event in its transaction'
);
select ok(
  position(
    'status = ''played'''
    in lower(pg_get_functiondef(
      'public.complete_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'status = ''available'''
    in lower(pg_get_functiondef(
      'public.complete_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'completion marks queue entries played and releases its court'
);
select ok(
  position(
    'status = ''waiting'''
    in lower(pg_get_functiondef(
      'public.cancel_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'status = ''available'''
    in lower(pg_get_functiondef(
      'public.cancel_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'cancellation returns queue entries to waiting and releases its court'
);
select ok(
  position(
    'insert into public.audit_logs'
    in lower(pg_get_functiondef(
      'public.cancel_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0
  and position(
    'clean_reason'
    in lower(pg_get_functiondef(
      'public.cancel_match(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'match cancellations require and record an audit reason'
);
select ok(
  pg_get_function_result('public.get_session_matches(uuid)'::regprocedure)
    like '%player_names%'
  and pg_get_function_result('public.get_session_matches(uuid)'::regprocedure)
    not like '%email%',
  'session history returns player names but not email addresses'
);
select ok(
  position(
    'own_match_player.player_id = current_user_id'
    in lower(pg_get_functiondef(
      'public.get_my_match_history()'::regprocedure
    ))
  ) > 0,
  'personal match history is filtered to the authenticated player'
);
select ok(
  position(
    'case when can_manage then match.notes else null end'
    in lower(pg_get_functiondef(
      'public.get_session_matches(uuid)'::regprocedure
    ))
  ) > 0,
  'private staff notes are hidden from players in session history'
);

select * from finish();

rollback;
