-- Deactivation blocks the person's own login/access — sub-project 1 follow-up.
-- Source of truth: approved plan §2 ("New migration — deactivate blocks the
-- person's own login/access").
--
-- Problem: the "it's my own row" branches of the profiles / student_details
-- read+self-update policies used a plain `id = auth.uid()` / `profile_id =
-- auth.uid()` with no is_active check. The is_active gate only lived inside
-- is_superadmin()/is_admin(), which govern access to *other* people's rows —
-- so setting profiles.is_active = false (superadmin-only, enforced by the
-- guard_profiles_update trigger) did NOT stop the deactivated person from
-- reading/updating their own profile or student_details. Since every screen
-- needs a readable profile to know who the user is, cutting off the own-row
-- read is what actually revokes app access (RequireAuth signs them out when
-- the profile query settles to null).
--
-- Fix: add an is_active check to the own-row branch of each policy only. The
-- is_superadmin() / is_admin()+can_access_student() branches are left exactly
-- as they were, so a superadmin/adviser can still SEE a deactivated person's
-- row (e.g. to render an "Inactive" badge in the Teachers/Students list).
-- student_details has no is_active column of its own, so it gates via an
-- EXISTS lookup on the owning profiles row.
--
-- Accepted residual scope: this closes the practical gate (own-profile read),
-- but does NOT retroactively add is_active checks to every other table's
-- own-row branch (e.g. enrollments.student_id = auth.uid()). A direct REST
-- call could still read a deactivated student's own historical enrollment row.
-- Auditing every such policy is out of scope here — a known, accepted v1
-- boundary, not a silent gap.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "read profiles" on profiles;
create policy "read profiles" on profiles for select to authenticated using (
  (id = auth.uid() and is_active) or public.is_superadmin()
  or (public.is_admin() and role = 'normal' and public.can_access_student(id))
);

drop policy if exists "update own profile" on profiles;
create policy "update own profile" on profiles for update to authenticated
  using (id = auth.uid() and is_active) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- student_details (no is_active column of its own — gate via profiles)
-- ---------------------------------------------------------------------------
drop policy if exists "read student_details" on student_details;
create policy "read student_details" on student_details for select to authenticated using (
  (profile_id = auth.uid()
   and exists (select 1 from profiles p where p.id = auth.uid() and p.is_active))
  or public.is_superadmin() or public.can_access_student(profile_id));

drop policy if exists "student updates own guardian info" on student_details;
create policy "student updates own guardian info" on student_details for update to authenticated
  using (profile_id = auth.uid()
         and exists (select 1 from profiles p where p.id = auth.uid() and p.is_active))
  with check (profile_id = auth.uid());
