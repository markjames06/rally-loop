begin;

select plan(21);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'facilities', 'facilities table exists');
select has_table(
  'public',
  'facility_members',
  'facility_members table exists'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'profiles has row level security enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.facilities'::regclass),
  'facilities has row level security enabled'
);
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.facility_members'::regclass
  ),
  'facility_members has row level security enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can read their own profile'
      and qual like '%auth.uid%'
  ),
  'profile reads are limited to the account owner'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update permitted fields on their own profile'
      and qual like '%auth.uid%'
      and with_check like '%auth.uid%'
  ),
  'profile updates are limited to the account owner'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'facilities'
      and policyname = 'Facility members can read their facility'
      and qual like '%is_facility_member%'
  ),
  'facility reads are scoped through the facility membership helper'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'facilities'
      and policyname = 'Facility admins can update their facility'
      and qual like '%is_facility_member%'
      and with_check like '%is_facility_member%'
  ),
  'facility updates are guarded by admin membership'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'facility_members'
      and policyname = 'Users can read their own facility memberships'
      and qual like '%auth.uid%'
  ),
  'users can only read their own memberships unless facility admins'
);
select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'facility_members'
      and policyname = 'Facility admins can read facility memberships'
      and qual like '%is_facility_member%'
  ),
  'only facility admins can read other facility memberships'
);
select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'facility_members'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and 'authenticated' = any (roles::text[])
  ),
  'authenticated users have no membership-changing RLS policies'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.is_facility_member(uuid,public.facility_role[])',
    'execute'
  ),
  'anonymous users cannot execute the membership helper'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.is_facility_member(uuid,public.facility_role[])',
    'execute'
  ),
  'authenticated users can execute the membership helper'
);
select ok(
  has_column_privilege(
    'authenticated',
    'public.profiles',
    'display_name',
    'UPDATE'
  ),
  'authenticated users can update their profile display name'
);
select ok(
  not has_column_privilege(
    'authenticated',
    'public.profiles',
    'id',
    'UPDATE'
  ),
  'authenticated users cannot change profile ownership'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anonymous users cannot read profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.facility_members', 'INSERT'),
  'authenticated users cannot assign facility roles'
);
select ok(
  not has_table_privilege('authenticated', 'public.facility_members', 'UPDATE'),
  'authenticated users cannot change their facility role'
);
select ok(
  not has_column_privilege(
    'authenticated',
    'public.facilities',
    'created_by',
    'UPDATE'
  ),
  'authenticated users cannot change facility ownership'
);

select * from finish();

rollback;
