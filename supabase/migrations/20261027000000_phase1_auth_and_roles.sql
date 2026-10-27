create type public.facility_role as enum ('admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  address text,
  timezone text not null check (char_length(btrim(timezone)) > 0),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.facility_members (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid not null references public.facilities (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.facility_role not null,
  created_at timestamptz not null default now(),
  unique (facility_id, user_id)
);

create index facility_members_user_id_idx
  on public.facility_members (user_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger facilities_set_updated_at
before update on public.facilities
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  if char_length(profile_name) not between 2 and 80 then
    raise exception 'A display name between 2 and 80 characters is required';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, profile_name);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create function public.is_facility_member(
  _facility_id uuid,
  _roles public.facility_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.facility_members as member
    where member.facility_id = _facility_id
      and member.user_id = (select auth.uid())
      and member.role = any (_roles)
  );
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_facility_member(uuid, public.facility_role[]) from public, anon;
grant execute on function public.is_facility_member(uuid, public.facility_role[]) to authenticated;

alter table public.profiles enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_members enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

revoke all on public.facilities from anon, authenticated;
grant select on public.facilities to authenticated;
grant update (name, slug, address, timezone) on public.facilities to authenticated;

revoke all on public.facility_members from anon, authenticated;
grant select on public.facility_members to authenticated;
grant usage on type public.facility_role to authenticated;

create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update permitted fields on their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Facility members can read their facility"
on public.facilities
for select
to authenticated
using (
  public.is_facility_member(
    id,
    array['admin', 'staff']::public.facility_role[]
  )
);

create policy "Facility admins can update their facility"
on public.facilities
for update
to authenticated
using (
  public.is_facility_member(id, array['admin']::public.facility_role[])
)
with check (
  public.is_facility_member(id, array['admin']::public.facility_role[])
);

create policy "Users can read their own facility memberships"
on public.facility_members
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Facility admins can read facility memberships"
on public.facility_members
for select
to authenticated
using (
  public.is_facility_member(
    facility_id,
    array['admin']::public.facility_role[]
  )
);
