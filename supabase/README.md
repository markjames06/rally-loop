# Supabase setup

## Apply the migrations

Apply migrations in filename order using the Supabase SQL Editor or the Supabase CLI. Apply the Phase 4 queue status migration before the match lifecycle migration because PostgreSQL does not permit a newly added enum value to be used until its migration commits. Then apply the match `updated_at` migration.

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

## Phase 4 court and match lifecycle

Apply [`migrations/20261030000000_phase4_queue_played_status.sql`](./migrations/20261030000000_phase4_queue_played_status.sql), then [`migrations/20261030000100_phase4_match_lifecycle.sql`](./migrations/20261030000100_phase4_match_lifecycle.sql), then [`migrations/20261030000200_match_updated_at.sql`](./migrations/20261030000200_match_updated_at.sql). The first migration adds the terminal `played` queue state; keep it separate so PostgreSQL commits the enum change before later functions use it. The final migration adds the column used by the match update timestamp trigger.

Staff/admin RPCs assign the next eligible FIFO group to an available court, start matches, complete in-progress matches, and cancel active matches. Each operation is a single database transaction. Assignment creates the match and player links, marks queue entries `assigned`, reserves the court, and records an audit event. Completion marks entries `played` and releases the court. Cancellation requires a reason, restores entries to `waiting` without changing their original FIFO timestamps, releases the court, and records an audit event.

A partial unique index prevents simultaneous active matches on one court. Assignment serializes on the session, locks selected queue/profile rows, checks for active matches across sessions, and is the only client-granted path for creating matches. Queue joins also lock the player profile and reject players who already have an assigned or in-progress match. Direct client access to match and match-player tables is revoked; authenticated history functions return display names only, and staff notes are hidden from players. Database triggers prevent manual court release and incompatible session/court edits while matches are active.

The management page contains court assignment, match controls, and recent history. Players can see open-session match status and their personal match history from the player page.

## Phase 5 session-scoped Realtime

Apply [`migrations/20261031000000_phase5_realtime_broadcasts.sql`](./migrations/20261031000000_phase5_realtime_broadcasts.sql) after all Phase 1–4 migrations. It adds database triggers for queue, court, session-court link, session, and match changes. Triggers publish only the affected session topic and table/operation metadata through Supabase Broadcast; they never publish row data. A private `realtime.messages` select policy allows signed-in users to join open-session topics and limits non-open session topics to facility staff/admin. The migration does not grant direct access to matches or match players.

The browser subscribes to the session topics visible on the session, management, and player-history screens. An event or a successful (re)connection refreshes the route; the page then reloads authoritative data through the existing server queries and protected RPCs. Duplicate events are coalesced into a single refresh. A manual Refresh button remains available, and a connection indicator warns when displayed data may be stale. Anonymous visitors can still browse public session details, but must sign in to receive live updates.

For a two-client check, sign in from two separate browser sessions and open the same open-session page in both. Join or leave the queue in one and verify the other reloads the waiting order and current user's position. Then use a staff account in a separate window to assign, start, complete, and cancel a match; verify the session page, management view, and affected player's history update. Briefly disconnect and reconnect one browser and verify it reloads current database state; use Refresh while disconnected to confirm the manual fallback.

## Validate row-level security

Run [`tests/database/phase1_auth_rls.test.sql`](./tests/database/phase1_auth_rls.test.sql), [`tests/database/phase2_facilities_sessions.test.sql`](./tests/database/phase2_facilities_sessions.test.sql), [`tests/database/phase3_queue.test.sql`](./tests/database/phase3_queue.test.sql), [`tests/database/phase4_matches.test.sql`](./tests/database/phase4_matches.test.sql), and [`tests/database/phase5_realtime.test.sql`](./tests/database/phase5_realtime.test.sql) against the migrated Supabase database with pgTAP available. Each test rolls back its transaction and checks the relevant RLS, grants, and database contracts.

The TypeScript auth, facility, queue, and match rules tests run with `npm test`.
