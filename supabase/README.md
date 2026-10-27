# Supabase setup

## Apply the migrations

Apply migrations in filename order using the Supabase SQL Editor or the Supabase CLI.

The Phase 1 migration creates:

- `profiles`, with a database trigger that creates a profile from validated sign-up metadata.
- `facilities` and `facility_members`, with staff/admin roles and one membership per user per facility.
- A security-definer membership check used by facility-scoped RLS policies.
- RLS policies and column/table grants that prevent account holders from assigning or changing facility roles.

The authentication phase does not create facilities or manage staff.

## Bootstrap the first facility administrator

A trusted Supabase project owner must provision the initial facility and admin membership through the Supabase SQL Editor. The application intentionally does not let a user grant themselves a facility role. Replace the sample values with your own facility details and the exact email used to register and confirm the first administrator account. Run once:

```sql
begin;

do $$
declare
  admin_user_id uuid;
  new_facility_id uuid;
begin
  select profile.id
  into admin_user_id
  from auth.users as auth_user
  join public.profiles as profile on profile.id = auth_user.id
  where lower(auth_user.email) = lower('ADMIN_EMAIL')
    and auth_user.email_confirmed_at is not null;

  if admin_user_id is null then
    raise exception 'No confirmed RallyLoop account was found for ADMIN_EMAIL';
  end if;

  insert into public.facilities (name, slug, timezone, created_by)
  values ('Pilot Facility', 'pilot-facility', 'UTC', admin_user_id)
  returning id into new_facility_id;

  insert into public.facility_members (facility_id, user_id, role)
  values (new_facility_id, admin_user_id, 'admin');
end;
$$;

commit;
```

Only a trusted project owner should run this script. Do not expose a client-side action for changing `facility_members.role`. Staff/admin assignments remain a privileged operation until a later approved feature implements secure management.

## Phase 2 facilities, courts, and sessions

After both migrations are applied and the first facility administrator is provisioned, the admin can open `/management/{facilityId}` to update facility details, manage courts, and create/edit sessions. The application does not create facilities or let users assign facility roles. The Phase 2 migration seeds Pickleball, Badminton, and Tennis.

Session times are entered and displayed in the facility's IANA timezone and stored in PostgreSQL as UTC timestamps. Session saves run through the `save_session` PostgreSQL function, which checks the caller's admin membership, validates facility/sport/court compatibility, and writes session details and court links in one transaction. Court writes use RLS and facility-scoped admin policies. Open sessions and the minimum facility/sport/court details needed to discover them are public; other session states and unassigned courts remain facility-scoped. Queue operations and matches are not part of this phase.

## Phase 3 transactional queue

Apply [`migrations/20261029000000_phase3_queue_engine.sql`](./migrations/20261029000000_phase3_queue_engine.sql) after Phase 1 and Phase 2. Queue joins, withdrawals, and staff skips use PostgreSQL functions that lock the session row and run each state change as one transaction. A partial unique index prevents multiple waiting/assigned entries for a player in a session. Positions are calculated from waiting entries ordered by `joined_at`, then entry ID.

Players can join or leave their own waiting entry. Facility staff can skip a waiting entry with a required reason; the status update and audit log are written atomically. Queue reads expose waiting players' display names and positions, never emails. Direct client inserts, updates, and deletes of queue entries and audit logs are revoked.

Phase 3 does not assign players to matches. The queue status reserves `assigned` for the later match lifecycle, but the match schema and active-match eligibility checks arrive in Phase 4; do not treat queue join as match assignment.

## Validate row-level security

Run [`tests/database/phase1_auth_rls.test.sql`](./tests/database/phase1_auth_rls.test.sql), [`tests/database/phase2_facilities_sessions.test.sql`](./tests/database/phase2_facilities_sessions.test.sql), and [`tests/database/phase3_queue.test.sql`](./tests/database/phase3_queue.test.sql) against the migrated Supabase database with pgTAP available. Each test rolls back its transaction and checks the relevant RLS, grants, and database contracts.

The TypeScript auth, facility, and queue rules tests run with `npm test`.
