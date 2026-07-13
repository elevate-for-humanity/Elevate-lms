-- Backfill program_media, program_ctas, program_tracks, program_modules for ALL published programs
-- Run this migration once to seed all program relations
-- Safe to re-run (uses ON CONFLICT DO NOTHING)

DO $$
DECLARE
  prog RECORD;
  media_count INT;
  cta_count INT;
  track_count INT;
  module_count INT;
BEGIN
  
  RAISE NOTICE 'Starting program relations backfill...';

  -- Iterate through all published programs
  FOR prog IN SELECT id, slug, title FROM public.programs WHERE published = true AND is_active = true LOOP
  
    -- ── 1. program_media ───────────────────────────────────────────────────────
    -- Check if media already exists
    SELECT COUNT(*) INTO media_count FROM public.program_media WHERE program_id = prog.id;
    
    IF media_count = 0 THEN
      INSERT INTO public.program_media (program_id, media_type, url, alt_text, sort_order)
      VALUES
        (prog.id, 'hero_image', '/images/pages/' || prog.slug || '-hero.jpg', prog.title || ' program hero image', 1),
        (prog.id, 'thumbnail', '/images/pages/' || prog.slug || '-thumb.jpg', prog.title || ' thumbnail', 2)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_media for: %', prog.slug;
    END IF;

    -- ── 2. program_ctas ────────────────────────────────────────────────────────
    SELECT COUNT(*) INTO cta_count FROM public.program_ctas WHERE program_id = prog.id;
    
    IF cta_count = 0 THEN
      INSERT INTO public.program_ctas (program_id, cta_type, label, href, style_variant, is_external, sort_order)
      VALUES
        (prog.id, 'apply', 'Apply Now', '/programs/' || prog.slug || '/apply', 'primary', FALSE, 1),
        (prog.id, 'request_info', 'Check My Eligibility', '/contact?program=' || prog.slug, 'secondary', FALSE, 2),
        (prog.id, 'waitlist', 'Join Waitlist', '/programs/' || prog.slug || '/waitlist', 'ghost', FALSE, 3)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_ctas for: %', prog.slug;
    END IF;

    -- ── 3. program_tracks ──────────────────────────────────────────────────────
    SELECT COUNT(*) INTO track_count FROM public.program_tracks WHERE program_id = prog.id;
    
    IF track_count = 0 THEN
      INSERT INTO public.program_tracks (program_id, track_code, title, description, funding_type, cost_cents, available, sort_order)
      VALUES
        (prog.id, 'WIOA', 'WIOA Funded', 'Indiana Workforce Innovation and Opportunity Act funding available for eligible residents.', 'funded', NULL, TRUE, 1),
        (prog.id, 'SELF_PAY', 'Self-Pay', 'Pay out-of-pocket with payment plan options available.', 'self_pay', 250000, TRUE, 2),
        (prog.id, 'EMPLOYER', 'Employer Sponsored', 'Your employer covers tuition and materials.', 'employer_sponsored', NULL, TRUE, 3)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_tracks for: %', prog.slug;
    END IF;

    -- ── 4. program_modules ─────────────────────────────────────────────────────
    SELECT COUNT(*) INTO module_count FROM public.program_modules WHERE program_id = prog.id;
    
    IF module_count = 0 THEN
      -- Insert 5 default modules for all programs
      INSERT INTO public.program_modules (program_id, module_number, title, description, lesson_count, duration_hours, sort_order)
      VALUES
        (prog.id, 1, 'Foundation & Orientation', 'Program introduction, expectations, and foundational knowledge.', 5, 4, 1),
        (prog.id, 2, 'Core Skills Development', 'Primary technical skills and hands-on practice.', 8, 6, 2),
        (prog.id, 3, 'Certification Preparation', 'Exam prep and credentialing requirements.', 6, 5, 3),
        (prog.id, 4, 'Clinical/Practical Application', 'Real-world application and supervised practice.', 8, 7, 4),
        (prog.id, 5, 'Career Readiness', 'Job placement support, resume building, and employer connections.', 4, 3, 5)
      ON CONFLICT DO NOTHING;
      RAISE NOTICE '  Inserted program_modules for: %', prog.slug;
    END IF;

  END LOOP;

  RAISE NOTICE 'Program relations backfill complete!';

END $$;

-- Verify counts
SELECT 
  'program_media' as table_name, COUNT(*) as row_count FROM public.program_media
UNION ALL
SELECT 
  'program_ctas', COUNT(*) FROM public.program_ctas
UNION ALL
SELECT 
  'program_tracks', COUNT(*) FROM public.program_tracks
UNION ALL
SELECT 
  'program_modules', COUNT(*) FROM public.program_modules;
