# Supabase Phase 1 setup

## Apply the migration

Apply migrations in filename order using the Supabase SQL Editor or the Supabase CLI. Phase 1 creates:

- `profiles`, with a database trigger that creates a profile from validated sign-up metadata.
- `facilities` and `facility_members`, with staff/admin roles and one membership per user per facility.
- A security-definer membership check used by facility-scoped RLS policies.
- RLS policies and column/table grants that prevent account holders from assigning or changing facility roles.

The application has no facility-creation or staff-management UI in this phase.

## Bootstrap the first facility administrator

Until Phase 2 facility setup is implemented, a trusted Supabase project owner must provision the initial facility and admin membership through the Supabase SQL Editor. Replace the sample values with your own facility details and the exact email used to register and confirm the first administrator account. Run once:

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

## Validate row-level security

Run [`tests/database/phase1_auth_rls.test.sql`](./tests/database/phase1_auth_rls.test.sql) against the migrated Supabase database with pgTAP available. The file rolls back its transaction and checks that RLS is enabled, reads are membership-scoped, and authenticated/anonymous API roles cannot modify membership roles or profile ownership.

The TypeScript auth and redirect tests run with `npm test`.
