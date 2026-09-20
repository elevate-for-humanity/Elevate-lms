-- Align every Indiana beauty Registered Apprenticeship with the sponsor's
-- Department of Labor standard: 2,000 hours of On-the-Job Learning (OJL).
-- School-license clock hours are not apprenticeship completion hours.

UPDATE public.programs
SET total_hours = 2000,
    description = replace(
      replace(
        replace(
          replace(
            replace(description, '400 hours', '2,000 OJL hours'),
            '450 hours', '2,000 OJL hours'
          ),
          '600 hours', '2,000 OJL hours'
        ),
        '700 hours', '2,000 OJL hours'
      ),
      '1,500 hours', '2,000 OJL hours'
    )
WHERE slug IN (
  'barber-apprenticeship',
  'cosmetology-apprenticeship',
  'esthetician-apprenticeship',
  'esthetics-apprenticeship',
  'nail-tech-apprenticeship',
  'nail-technician-apprenticeship'
);

UPDATE public.training_courses
SET duration_hours = 2000
WHERE program_id IN (
  SELECT id
  FROM public.programs
  WHERE slug IN (
    'barber-apprenticeship',
    'cosmetology-apprenticeship',
    'esthetician-apprenticeship',
    'esthetics-apprenticeship',
    'nail-tech-apprenticeship',
    'nail-technician-apprenticeship'
  )
)
AND duration_hours IN (400, 450, 600, 700, 1500);
