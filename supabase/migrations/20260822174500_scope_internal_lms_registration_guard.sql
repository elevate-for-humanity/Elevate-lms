-- Internal LMS delivery is used by both apprenticeship and non-apprenticeship
-- programs. Only actual apprenticeships require an apprenticeship_programs row.

create or replace function public.enforce_lms_program_registration()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.delivery_model = 'internal_lms'
     and coalesce(new.is_apprenticeship, false) then
    if not exists (
      select 1
      from public.apprenticeship_programs
      where slug = new.slug
    ) then
      raise exception
        'LMS_PROGRAM_NOT_REGISTERED: apprenticeship program slug % must exist in apprenticeship_programs before delivery_model can be set to internal_lms.',
        new.slug;
    end if;
  end if;

  return new;
end;
$$;
