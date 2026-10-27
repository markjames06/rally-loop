begin;

select plan(33);

select has_table('public', 'queue_entries', 'queue_entries table exists');
select has_table('public', 'audit_logs', 'audit_logs table exists');

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.queue_entries'::regclass
  ),
  'queue entries have row level security enabled'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.audit_logs'::regclass
  ),
  'audit logs have row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_index
    where indexrelid =
      'public.queue_entries_one_active_per_player_session_idx'::regclass
      and pg_get_expr(indpred, indrelid) like '%waiting%'
      and pg_get_expr(indpred, indrelid) like '%assigned%'
  ),
  'a partial unique index prevents duplicate active queue entries'
);
select ok(
  exists (
    select 1
    from pg_index
    where indexrelid = 'public.queue_entries_waiting_fifo_idx'::regclass
      and pg_get_expr(indpred, indrelid) like '%waiting%'
  ),
  'waiting queue entries have an indexed session FIFO order'
);
select ok(
  exists (
    select 1
    from pg_trigger
    where tgname = 'queue_entries_set_updated_at'
      and tgrelid = 'public.queue_entries'::regclass
      and not tgisinternal
  ),
  'queue entry updates maintain updated_at'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'queue_entries'
      and policyname = 'Players can read their own queue entries'
      and qual like '%auth.uid%'
  ),
  'players can read only their own queue entry rows'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'queue_entries'
      and policyname = 'Facility staff can read session queue entries'
      and qual like '%is_facility_member%'
  ),
  'facility staff can read their facility queue'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'Facility admins can read queue audit logs'
      and qual like '%is_facility_member%'
  ),
  'audit log reads are scoped to facility administrators'
);
select ok(
  not has_table_privilege('anon', 'public.audit_logs', 'SELECT'),
  'anonymous users cannot read audit logs'
);
select ok(
  not has_table_privilege('authenticated', 'public.queue_entries', 'INSERT'),
  'clients cannot insert queue entries directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.queue_entries', 'UPDATE'),
  'clients cannot update queue entries directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.queue_entries', 'DELETE'),
  'clients cannot delete queue entries directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'),
  'clients cannot write audit records directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE'),
  'clients cannot modify audit records directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.audit_logs', 'DELETE'),
  'clients cannot delete audit records directly'
);

select ok(
  to_regprocedure('public.join_queue(uuid)') is not null,
  'the transactional join function exists'
);
select ok(
  to_regprocedure('public.leave_queue(uuid)') is not null,
  'the transactional leave function exists'
);
select ok(
  to_regprocedure('public.get_session_queue(uuid)') is not null,
  'the authoritative queue view function exists'
);
select ok(
  to_regprocedure('public.skip_queue_entry(uuid,uuid,text)') is not null,
  'the audited staff skip function exists'
);

select ok(
  has_function_privilege('authenticated', 'public.join_queue(uuid)', 'EXECUTE'),
  'authenticated players can invoke the join function'
);
select ok(
  not has_function_privilege('anon', 'public.join_queue(uuid)', 'EXECUTE'),
  'anonymous users cannot join a queue'
);
select ok(
  has_function_privilege('authenticated', 'public.leave_queue(uuid)', 'EXECUTE'),
  'authenticated players can invoke the leave function'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.get_session_queue(uuid)',
    'EXECUTE'
  ),
  'authenticated users can view queues'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.get_session_queue(uuid)',
    'EXECUTE'
  ),
  'anonymous users cannot enumerate queue players'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.skip_queue_entry(uuid,uuid,text)',
    'EXECUTE'
  ),
  'authenticated users can invoke the staff-checked skip function'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.skip_queue_entry(uuid,uuid,text)',
    'EXECUTE'
  ),
  'anonymous users cannot skip queue entries'
);

select ok(
  (
    select prosecdef
    from pg_proc
    where oid = 'public.join_queue(uuid)'::regprocedure
  )
  and (
    select prosecdef
    from pg_proc
    where oid = 'public.leave_queue(uuid)'::regprocedure
  )
  and (
    select prosecdef
    from pg_proc
    where oid = 'public.skip_queue_entry(uuid,uuid,text)'::regprocedure
  ),
  'queue mutation functions execute with restricted database privileges'
);
select ok(
  pg_get_function_result('public.get_session_queue(uuid)'::regprocedure)
    like '%player_name%'
  and pg_get_function_result('public.get_session_queue(uuid)'::regprocedure)
    like '%queue_position%'
  and pg_get_function_result('public.get_session_queue(uuid)'::regprocedure)
    not like '%email%',
  'queue view exposes display names and position without player email addresses'
);
select ok(
  position(
    'row_number() over (order by entry.joined_at, entry.id)'
    in lower(pg_get_functiondef('public.get_session_queue(uuid)'::regprocedure))
  ) > 0,
  'queue positions use joined_at with a stable id tie-breaker'
);
select ok(
  position(
    'for update'
    in lower(pg_get_functiondef('public.join_queue(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.leave_queue(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef(
      'public.skip_queue_entry(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'queue mutations lock the session to serialize concurrent operations'
);
select ok(
  position(
    'insert into public.audit_logs'
    in lower(pg_get_functiondef(
      'public.skip_queue_entry(uuid,uuid,text)'::regprocedure
    ))
  ) > 0,
  'staff skips create an audit log in the same transaction'
);

select * from finish();

rollback;
