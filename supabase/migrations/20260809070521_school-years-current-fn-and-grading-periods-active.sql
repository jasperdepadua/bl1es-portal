-- Additive follow-up to core_entities/rls — sub-project 1: Auth & core entities.
-- Two independent, additive-only changes: no new tables, no new RLS policies
-- (existing "read config"/"superadmin writes config" policies on school_years
-- and grading_periods already cover the new column and function below).

-- ---------------------------------------------------------------------------
-- grading_periods: soft-delete column for consistency with school_years,
-- grade_levels, subjects (all use is_active rather than hard delete).
-- Nothing references grading_periods yet, but the app's rule is soft-delete
-- only, so this closes the gap before anything is built on top of it.
-- ---------------------------------------------------------------------------
alter table public.grading_periods add column if not exists is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- school_years: atomic "set current year" function.
-- school_years_one_current_idx (partial unique on is_current) guarantees at
-- most one current row, but nothing today unsets the previous current row
-- when a new one is set — a naive two-call client update (unset old, then
-- set new) isn't atomic and can leave zero current years if the second call
-- fails, or get rejected by the unique index if done in the wrong order.
-- No `security definer`: runs with the caller's own rights, so the existing
-- "superadmin writes config" policy on school_years (using/with check
-- public.is_superadmin()) already blocks non-superadmins from either UPDATE
-- inside this function — safe by construction, no RLS bypass needed.
-- ---------------------------------------------------------------------------
create or replace function public.set_current_school_year(p_year_id uuid)
returns void
language plpgsql
as $$
begin
  update public.school_years set is_current = false where is_current = true and id <> p_year_id;
  update public.school_years set is_current = true where id = p_year_id;
end;
$$;
