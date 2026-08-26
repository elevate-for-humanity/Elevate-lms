-- Pin the trigger function search path so role-level settings cannot change name resolution.
alter function public.enforce_apprenticeship_practical_evidence()
  set search_path = pg_catalog, public;
