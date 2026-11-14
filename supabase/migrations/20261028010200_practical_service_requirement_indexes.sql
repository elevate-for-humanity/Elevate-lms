-- The lesson foreign key is also queried independently when a lesson is
-- retired or its hands-on requirement is reconciled.
create index if not exists apprenticeship_practical_service_requirements_lesson_idx
  on public.apprenticeship_practical_service_requirements(lesson_id);
