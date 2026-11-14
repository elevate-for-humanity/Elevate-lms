-- Restore exact Appendix A identity links after the barber course changed slugs.
-- This records instructional coverage, not learner mastery or approved hours.
BEGIN;
DO $$
BEGIN
  IF (SELECT count(*) FROM public.course_lessons l
      JOIN public.courses c ON c.id=l.course_id
      JOIN public.apprenticeship_standard_competencies s ON s.competency_key=l.slug
      WHERE c.slug='barber-apprenticeship' AND c.is_active
        AND s.standard_key='barber-0030cb-2025-07-10') <> 14 THEN
    RAISE EXCEPTION 'Expected exactly 14 current barber lesson/standard matches';
  END IF;
END; $$;

INSERT INTO public.barber_competency_mappings(lesson_id,competency_id,competency_label)
SELECT l.id,s.competency_key,s.category || ' — ' || s.description
FROM public.course_lessons l
JOIN public.courses c ON c.id=l.course_id
JOIN public.apprenticeship_standard_competencies s ON s.competency_key=l.slug
WHERE c.slug='barber-apprenticeship' AND c.is_active
  AND s.standard_key='barber-0030cb-2025-07-10'
  AND NOT EXISTS (
    SELECT 1 FROM public.barber_competency_mappings m
    WHERE m.lesson_id=l.id AND m.competency_id=s.competency_key
  );
COMMIT;
