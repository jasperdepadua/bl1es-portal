-- Row-Level Security for the BL1ES portal — sub-project 1: Auth & core entities.
-- Source of truth: plan Task 3 (the policy SQL below is reproduced from it).
-- Depends on the tables created in the companion `_core_entities.sql` migration.
--
-- Model (authorization is enforced here, never trusted from the client):
--   * superadmin           — full read/write everywhere.
--   * admin (adviser)      — full access to sections they advise + those sections' students.
--   * admin (subject tchr) — the subject's records for sections they're assigned to.
--   * normal (student)     — own profile / student_details / enrollments only.
-- Config/reference tables are readable by any authenticated user, writable by superadmin.

-- ---------------------------------------------------------------------------
-- Step 1: Helper functions.
-- SECURITY DEFINER so they run as the owner and BYPASS RLS — this both avoids
-- infinite policy recursion (e.g. a profiles policy that reads profiles) and
-- lets a user's own access be derived without granting broad table reads.
-- `set search_path = public` pins name resolution (no search_path hijacking).
-- ---------------------------------------------------------------------------
create or replace function public.is_superadmin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'superadmin' and is_active);
$$;

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and is_active);
$$;

create or replace function public.can_access_section(section uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from sections s where s.id = section and s.adviser_id = auth.uid())
      or exists (select 1 from subject_assignments sa
                 where sa.section_id = section and sa.teacher_id = auth.uid() and sa.is_active);
$$;

create or replace function public.can_access_student(student uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from enrollments e
                 where e.student_id = student and public.can_access_section(e.section_id));
$$;

-- ---------------------------------------------------------------------------
-- Step 2: Enable RLS on every table.
-- (Plan wrote this as one multi-table statement; Postgres ALTER TABLE takes a
--  single table, so it is expanded here into one statement per table.)
-- ---------------------------------------------------------------------------
alter table profiles             enable row level security;
alter table student_details      enable row level security;
alter table school_years         enable row level security;
alter table grading_periods      enable row level security;
alter table grade_levels         enable row level security;
alter table subjects             enable row level security;
alter table grade_level_subjects enable row level security;
alter table sections             enable row level security;
alter table enrollments          enable row level security;
alter table subject_assignments  enable row level security;

-- ---------------------------------------------------------------------------
-- Step 3: Reference/config tables — readable by any authenticated user,
-- writable by superadmin. (school_years, grading_periods, grade_levels,
-- subjects, grade_level_subjects, sections.)
-- ---------------------------------------------------------------------------
create policy "read config" on school_years for select to authenticated using (true);
create policy "superadmin writes config" on school_years for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read config" on grading_periods for select to authenticated using (true);
create policy "superadmin writes config" on grading_periods for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read config" on grade_levels for select to authenticated using (true);
create policy "superadmin writes config" on grade_levels for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read config" on subjects for select to authenticated using (true);
create policy "superadmin writes config" on subjects for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read config" on grade_level_subjects for select to authenticated using (true);
create policy "superadmin writes config" on grade_level_subjects for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read config" on sections for select to authenticated using (true);
create policy "superadmin writes config" on sections for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- Step 4: profiles
-- ---------------------------------------------------------------------------
create policy "read profiles" on profiles for select to authenticated using (
  id = auth.uid() or public.is_superadmin()
  or (public.is_admin() and role = 'normal' and public.can_access_student(id))
);
create policy "update own profile" on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "superadmin manages profiles" on profiles for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- Step 5: student_details, enrollments, subject_assignments
-- ---------------------------------------------------------------------------
create policy "read student_details" on student_details for select to authenticated using (
  profile_id = auth.uid() or public.is_superadmin() or public.can_access_student(profile_id));
create policy "student updates own guardian info" on student_details for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "superadmin manages student_details" on student_details for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read enrollments" on enrollments for select to authenticated using (
  student_id = auth.uid() or public.is_superadmin() or public.can_access_section(section_id));
create policy "superadmin manages enrollments" on enrollments for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

create policy "read subject_assignments" on subject_assignments for select to authenticated using (
  teacher_id = auth.uid() or public.is_superadmin() or public.can_access_section(section_id));
create policy "superadmin manages subject_assignments" on subject_assignments for all to authenticated
  using (public.is_superadmin()) with check (public.is_superadmin());

-- ---------------------------------------------------------------------------
-- Step 6: Column-guard triggers.
-- RLS grants access to a ROW but can't restrict WHICH columns a self-update
-- changes. Without these, a user with row access to their own record could
-- change privileged columns — e.g. set their own profiles.role = 'superadmin'.
-- Non-superadmins may only change non-privileged columns of their own row.
-- ---------------------------------------------------------------------------
create or replace function public.guard_profiles_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_superadmin() then return new; end if;
  if new.id        is distinct from old.id
  or new.role      is distinct from old.role
  or new.username  is distinct from old.username
  or new.is_active is distinct from old.is_active then
    raise exception 'Only a superadmin can change id, role, username, or is_active';
  end if;
  return new;
end $$;

create trigger guard_profiles_update
  before update on profiles for each row execute function public.guard_profiles_update();

create or replace function public.guard_student_details_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_superadmin() then return new; end if;
  if new.profile_id         is distinct from old.profile_id
  or new.student_number     is distinct from old.student_number
  or new.is_4ps_beneficiary is distinct from old.is_4ps_beneficiary then
    raise exception 'Only a superadmin can change student_number or is_4ps_beneficiary';
  end if;
  return new;
end $$;

create trigger guard_student_details_update
  before update on student_details for each row execute function public.guard_student_details_update();
