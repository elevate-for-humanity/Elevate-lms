-- Add issuance_policy to programs table.
-- course_certificate: issued on lesson completion (OSHA, EPA 608, etc.)
-- workforce_certificate: requires approved hour thresholds (barber, apprenticeships)

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS issuance_policy text NOT NULL DEFAULT 'course_certificate'
    CHECK (issuance_policy IN ('course_certificate', 'workforce_certificate'));

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS min_rti_hours integer DEFAULT 0;

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS min_ojt_hours integer DEFAULT 0;

-- Barber Apprenticeship: Indiana requires 2,000 total hours
-- RTI minimum 150h (Milady curriculum, theory, sanitation)
-- OJT minimum 1,700h (practical work under licensed barber)
-- 150h flexible between RTI/OJT
UPDATE public.programs
SET issuance_policy = 'workforce_certificate',
    required_hours = 2000,
    total_hours = 2000,
    min_rti_hours = 150,
    min_ojt_hours = 1700
WHERE slug = 'barber-apprenticeship';

-- All other apprenticeship programs default to workforce_certificate
-- with zero thresholds until program-specific requirements are defined
UPDATE public.programs
SET issuance_policy = 'workforce_certificate'
WHERE is_apprenticeship = true
  AND slug != 'barber-apprenticeship';
