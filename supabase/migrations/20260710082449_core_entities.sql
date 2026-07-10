-- Core entities for the BL1ES portal — sub-project 1: Auth & core entities.
-- Source of truth: specs/auth-and-core-entities.md § Data model (+ plan Task 2).
-- Forward-only; idempotent where sensible (guarded enum creation, `... if not exists`).
-- RLS is ENABLED and all policies live in the companion `_rls.sql` migration.
--
-- ON DELETE policy (spec is silent beyond profiles→auth.users; choices minimise
-- destructive cascades and are documented per-FK below):
--   * profiles.id            -> auth.users        CASCADE   (required by plan)
--   * *.<person>_id          -> profiles          CASCADE   (1:1/owned rows, so the
--                                                            auth.users cascade flows through)
--   * sections.adviser_id    -> profiles          SET NULL  (nullable; the shared section survives)
--   * every other FK         -> (config/academic) NO ACTION (default; protects referenced rows
--                                                            — these entities use is_active soft-delete)

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.role as enum ('superadmin', 'admin', 'normal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.shift as enum ('AM', 'PM');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.enrollment_status as enum ('enrolled', 'inactive');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users (shared id)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  role                public.role not null,
  first_name          text not null,
  last_name           text not null,
  profile_picture_url text,
  username            text unique,                 -- staff only; null for students
  contact_email       text,                        -- staff real email (invite/reset); null for students
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
-- FK `id` is served by the primary-key index; `username` by its UNIQUE index.

-- ---------------------------------------------------------------------------
-- student_details — 1:1 with profiles where role = 'normal'
-- ---------------------------------------------------------------------------
create table if not exists public.student_details (
  profile_id              uuid primary key references public.profiles (id) on delete cascade,
  student_number          text not null unique,    -- permanent identity, follows the child Kinder -> Grade 6
  guardian_name           text,
  guardian_relationship   text,
  guardian_contact_number text,
  guardian_email          text not null,           -- required: onboarding + notification channel
  is_4ps_beneficiary      boolean not null default false
);
-- FK `profile_id` is served by the primary-key index.

-- ---------------------------------------------------------------------------
-- school_years
-- ---------------------------------------------------------------------------
create table if not exists public.school_years (
  id         uuid primary key default gen_random_uuid(),
  label      text not null unique,                 -- e.g. "2026-2027"
  start_date date not null,
  end_date   date not null,
  is_current boolean not null default false
);
-- Enforce at most one current school year at a time.
create unique index if not exists school_years_one_current_idx
  on public.school_years (is_current) where is_current;

-- ---------------------------------------------------------------------------
-- grading_periods — configurable count per school year
-- ---------------------------------------------------------------------------
create table if not exists public.grading_periods (
  id             uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years (id),
  label          text not null,                    -- e.g. "Term 1"
  sequence       integer not null,                 -- order within the year
  start_date     date,
  end_date       date,
  unique (school_year_id, sequence)
);
-- FK `school_year_id` is served by the leading column of the (school_year_id, sequence) unique index.

-- ---------------------------------------------------------------------------
-- grade_levels — superadmin-managed, global across years
-- ---------------------------------------------------------------------------
create table if not exists public.grade_levels (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,                  -- e.g. "Kinder", "Grade 1"
  sequence  integer not null,                      -- explicit ordering (not alphabetical)
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- subjects — superadmin-managed, global
-- ---------------------------------------------------------------------------
create table if not exists public.subjects (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- grade_level_subjects — which subjects a grade level offers (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.grade_level_subjects (
  grade_level_id uuid not null references public.grade_levels (id),
  subject_id     uuid not null references public.subjects (id),
  primary key (grade_level_id, subject_id)
);
-- FK `grade_level_id` is served by the leading column of the composite primary key.
create index if not exists grade_level_subjects_subject_id_idx
  on public.grade_level_subjects (subject_id);

-- ---------------------------------------------------------------------------
-- sections — a class-instance for one grade level in one school year
-- ---------------------------------------------------------------------------
create table if not exists public.sections (
  id             uuid primary key default gen_random_uuid(),
  grade_level_id uuid not null references public.grade_levels (id),
  school_year_id uuid not null references public.school_years (id),
  name           text not null,                    -- e.g. "Mabini"
  adviser_id     uuid references public.profiles (id) on delete set null,  -- role=admin; null until assigned
  shift          public.shift,                     -- AM/PM (Kinder shifts) or null
  is_active      boolean not null default true,
  unique (grade_level_id, school_year_id, name)
);
-- FK `grade_level_id` is served by the leading column of the (grade_level_id, school_year_id, name) unique index.
create index if not exists sections_school_year_id_idx on public.sections (school_year_id);
create index if not exists sections_adviser_id_idx     on public.sections (adviser_id);

-- ---------------------------------------------------------------------------
-- enrollments — a student's membership in a section (history falls out across years)
-- ---------------------------------------------------------------------------
create table if not exists public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid not null references public.profiles (id) on delete cascade,  -- role=normal
  section_id     uuid not null references public.sections (id),
  school_year_id uuid not null references public.school_years (id),                -- denormalized from section
  status         public.enrollment_status not null default 'enrolled',
  unique (student_id, school_year_id)              -- one section per student per year
);
-- FK `student_id` is served by the leading column of the (student_id, school_year_id) unique index.
create index if not exists enrollments_section_id_idx     on public.enrollments (section_id);
create index if not exists enrollments_school_year_id_idx on public.enrollments (school_year_id);

-- ---------------------------------------------------------------------------
-- subject_assignments — who teaches what subject, where
-- ---------------------------------------------------------------------------
create table if not exists public.subject_assignments (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,  -- role=admin
  subject_id uuid not null references public.subjects (id),
  section_id uuid not null references public.sections (id),
  is_active  boolean not null default true,
  unique (teacher_id, subject_id, section_id)
);
-- FK `teacher_id` is served by the leading column of the (teacher_id, subject_id, section_id) unique index.
create index if not exists subject_assignments_subject_id_idx on public.subject_assignments (subject_id);
create index if not exists subject_assignments_section_id_idx on public.subject_assignments (section_id);
