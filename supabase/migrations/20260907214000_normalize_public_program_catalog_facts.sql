-- Keep the production program table aligned with the governed public schemas
-- and the approved Appendix A registered-apprenticeship standards.

update public.programs
set short_description = 'Registered, competency-based Barber apprenticeship (RAPIDS occupation 0030CB): 14 verified occupational competencies plus 260 required RTI hours, with supervised host-site practice.',
    description = 'Registered, competency-based Barber apprenticeship (RAPIDS occupation 0030CB): 14 verified occupational competencies plus 260 required RTI hours, with supervised host-site practice.',
    duration = null,
    duration_weeks = null
where slug = 'barber-apprenticeship';

update public.programs
set short_description = 'Registered, competency-based Esthetician apprenticeship (RAPIDS occupation 2089CB): 20 verified occupational competencies plus 300 required RTI hours, with supervised host-site practice.',
    description = 'Registered, competency-based Esthetician apprenticeship (RAPIDS occupation 2089CB): 20 verified occupational competencies plus 300 required RTI hours, with supervised host-site practice.',
    duration = null,
    duration_weeks = null
where slug = 'esthetician-apprenticeship';

update public.programs
set short_description = 'Registered, competency-based Manicurist apprenticeship (RAPIDS occupation 2090CB): 19 verified occupational competencies plus 210 required RTI hours, with supervised host-site practice.',
    description = 'Registered, competency-based Manicurist apprenticeship (RAPIDS occupation 2090CB): 19 verified occupational competencies plus 210 required RTI hours, with supervised host-site practice.',
    duration = null,
    duration_weeks = null
where slug = 'nail-technician-apprenticeship';

update public.programs
set short_description = 'Professional culinary training with hands-on kitchen practice and ServSafe preparation. This pathway is not represented as a federal Registered Apprenticeship.',
    description = 'Professional culinary training with hands-on kitchen practice and ServSafe preparation. This pathway is not represented as a federal Registered Apprenticeship.',
    duration = '26 weeks',
    duration_weeks = 26
where slug = 'culinary-apprenticeship';

update public.programs
set short_description = 'Youth culinary training with classroom instruction, supervised practice, and ServSafe Food Handler preparation. No federal Registered Apprenticeship claim is made.',
    description = 'Youth culinary training with classroom instruction, supervised practice, and ServSafe Food Handler preparation. No federal Registered Apprenticeship claim is made.'
where slug = 'youth-culinary-apprenticeship';

-- These vendor-labeled rows duplicate the canonical public pathways. Preserve
-- the records for audit history while removing them from public discovery.
update public.programs
set published = false,
    status = 'archived'
where slug in ('nha-medical-assistant', 'nha-pharmacy-technician', 'nha-phlebotomy');
