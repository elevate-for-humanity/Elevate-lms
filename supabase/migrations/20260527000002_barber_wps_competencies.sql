-- Indiana DOL Registered Apprenticeship — Barber Work Process Schedule (WPS)
-- Source: RAPIDS Occupation Code 330.371-010 / Indiana PLA requirements
-- OJL requirement: 2,000 hours | RTI requirement: 144 hours/year
--
-- This migration:
--   1. Creates competency_log table for per-service/per-skill progress entries
--   2. Seeds skill_categories with Indiana WPS work process areas for barber program
--   3. Seeds apprentice_skills with the specific competencies under each area
--
-- Apply in Supabase Dashboard → SQL Editor before using /apprentice/competencies

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Competency log table
--    Apprentices log individual service/skill completions; supervisor signs off.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.competency_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id          UUID NOT NULL REFERENCES public.apprentice_skills(id) ON DELETE CASCADE,
  program_id        UUID,                          -- denormalized for fast queries
  work_date         DATE NOT NULL,
  service_count     INTEGER NOT NULL DEFAULT 1,    -- number of times performed this session
  hours_credited    NUMERIC(4,1) NOT NULL DEFAULT 0, -- OJL hours this entry counts toward
  notes             TEXT,
  supervisor_name   TEXT,
  supervisor_verified BOOLEAN NOT NULL DEFAULT FALSE,
  supervisor_verified_at TIMESTAMPTZ,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competency_log_apprentice
  ON public.competency_log (apprentice_id, program_id);
CREATE INDEX IF NOT EXISTS idx_competency_log_skill
  ON public.competency_log (skill_id);
CREATE INDEX IF NOT EXISTS idx_competency_log_status
  ON public.competency_log (status);

ALTER TABLE public.competency_log ENABLE ROW LEVEL SECURITY;

-- Apprentices see only their own entries
CREATE POLICY "competency_log_apprentice_select"
  ON public.competency_log FOR SELECT
  USING (auth.uid() = apprentice_id);

-- Apprentices insert their own entries
CREATE POLICY "competency_log_apprentice_insert"
  ON public.competency_log FOR INSERT
  WITH CHECK (auth.uid() = apprentice_id);

-- Admins/staff/instructors manage all entries
CREATE POLICY "competency_log_admin_all"
  ON public.competency_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

COMMENT ON TABLE public.competency_log IS
  'Per-service competency entries for Indiana DOL barber apprenticeship WPS tracking. Each row = one session of a specific skill performed by an apprentice.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Resolve barber program_id
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  barber_program_id UUID;
  cat_id            UUID;
BEGIN

  SELECT id INTO barber_program_id
  FROM public.programs
  WHERE slug = 'barber-apprenticeship'
  LIMIT 1;

  IF barber_program_id IS NULL THEN
    RAISE NOTICE 'barber-apprenticeship program not found — seeding skill_categories without program_id FK';
  END IF;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Seed skill_categories (Indiana WPS work process areas)
--    These map directly to the DOL Work Process Schedule for Barber 330.371-010
-- ─────────────────────────────────────────────────────────────────────────────

  -- WPS Area 1: Haircutting Services
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'Haircutting Services',
    barber_program_id,
    1,
    'Scissor cuts, clipper cuts, fades, tapers, and razor work — core OJL competencies per Indiana WPS'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 2: Shaving & Facial Hair Services
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000002',
    'Shaving & Facial Hair Services',
    barber_program_id,
    2,
    'Straight razor shaves, beard trims, mustache shaping — Indiana WPS required services'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 3: Chemical Services
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000003',
    'Chemical Services',
    barber_program_id,
    3,
    'Hair color, relaxers, perms, and chemical texture services per Indiana PLA requirements'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 4: Scalp & Hair Treatments
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000004',
    'Scalp & Hair Treatments',
    barber_program_id,
    4,
    'Scalp analysis, conditioning treatments, and therapeutic services'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 5: Sanitation, Safety & Infection Control
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000005',
    'Sanitation, Safety & Infection Control',
    barber_program_id,
    5,
    'Indiana State Board sanitation standards — mandatory for licensure exam'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 6: Client Consultation & Professional Skills
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000006',
    'Client Consultation & Professional Skills',
    barber_program_id,
    6,
    'Intake, consultation, communication, and shop business practices'
  )
  ON CONFLICT (id) DO NOTHING;

  -- WPS Area 7: Anatomy, Physiology & Theory (RTI)
  INSERT INTO public.skill_categories (id, name, program_id, "order", description)
  VALUES (
    'a1000000-0000-0000-0000-000000000007',
    'Anatomy, Physiology & Theory (RTI)',
    barber_program_id,
    7,
    'Related Technical Instruction — theory required for Indiana State Board exam (144 hrs/yr)'
  )
  ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Seed apprentice_skills (specific competencies per WPS area)
-- ─────────────────────────────────────────────────────────────────────────────

  -- ── Area 1: Haircutting Services ──────────────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000001-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Scissor-over-comb cut', 'Full haircut using scissor-over-comb technique on all hair types', 1),
    ('b1000001-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Clipper cut (guard)', 'Clipper cut using guards — length selection, blending, and finishing', 2),
    ('b1000001-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Skin fade / bald fade', 'Zero-gap fade from skin to length — taper, low, mid, and high fade variations', 3),
    ('b1000001-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Taper cut', 'Graduated taper at neckline and sides — natural finish', 4),
    ('b1000001-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Razor / open-razor cut', 'Texturizing and cutting with straight or shaper razor', 5),
    ('b1000001-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Line-up / edge work', 'Hairline, temple, and neckline edging with trimmer or razor', 6),
    ('b1000001-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Flat-top / box cut', 'Precision flat-top and box fade construction', 7),
    ('b1000001-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', barber_program_id,
     'Curly / textured hair cut', 'Cutting techniques specific to Type 3–4 curl patterns', 8)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 2: Shaving & Facial Hair Services ────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000002-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Straight razor shave (full)', 'Complete hot-towel straight razor shave — prep, lather, stroke technique, aftercare', 1),
    ('b1000002-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Beard trim & shape', 'Beard outline, bulk removal, and finishing with scissors and trimmer', 2),
    ('b1000002-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Mustache trim & design', 'Mustache shaping, trimming, and styling', 3),
    ('b1000002-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Neck shave / neckline cleanup', 'Razor cleanup of neckline and neck hair between cuts', 4),
    ('b1000002-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', barber_program_id,
     'Hot towel treatment', 'Preparation and application of hot towel for pre-shave softening', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 3: Chemical Services ─────────────────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000003-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Single-process hair color', 'Application of permanent or semi-permanent color — patch test, mixing, timing, removal', 1),
    ('b1000003-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Highlights / lowlights', 'Foil or freehand highlight/lowlight application', 2),
    ('b1000003-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Chemical relaxer application', 'Sodium hydroxide or no-lye relaxer — strand test, application, neutralization', 3),
    ('b1000003-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Permanent wave (perm)', 'Rod selection, waving solution application, neutralization', 4),
    ('b1000003-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', barber_program_id,
     'Color correction / toning', 'Toner application and basic color correction techniques', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 4: Scalp & Hair Treatments ──────────────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000004-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Scalp analysis', 'Identify scalp conditions (dry, oily, dandruff, alopecia indicators) and recommend treatment', 1),
    ('b1000004-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Deep conditioning treatment', 'Application and processing of deep conditioner or protein treatment', 2),
    ('b1000004-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Scalp massage', 'Manual scalp massage technique — stimulation, relaxation, product distribution', 3),
    ('b1000004-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', barber_program_id,
     'Dandruff / scalp treatment service', 'Medicated or therapeutic scalp treatment application', 4)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 5: Sanitation, Safety & Infection Control ────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000005-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Tool disinfection (EPA-registered)', 'Proper disinfection of combs, brushes, clippers, and shears per Indiana State Board rules', 1),
    ('b1000005-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Workstation sanitation between clients', 'Full workstation wipe-down, cape change, and surface disinfection protocol', 2),
    ('b1000005-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Bloodborne pathogen protocol', 'Exposure response, sharps disposal, and PPE use per OSHA BBP standard', 3),
    ('b1000005-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Clipper blade sterilization', 'Blade removal, cleaning, and sterilization with barbicide or autoclave', 4),
    ('b1000005-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', barber_program_id,
     'Identify & refuse service for contraindications', 'Recognize contagious scalp/skin conditions and apply refusal-of-service protocol', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 6: Client Consultation & Professional Skills ─────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000006-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Client intake & consultation', 'Conduct intake, identify desired service, review contraindications, confirm expectations', 1),
    ('b1000006-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Service ticket / record keeping', 'Complete client service record with services performed, products used, and notes', 2),
    ('b1000006-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Retail product recommendation', 'Recommend and explain retail products appropriate to client hair type and service', 3),
    ('b1000006-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Appointment scheduling & shop operations', 'Booking, rescheduling, no-show handling, and basic POS/cash handling', 4),
    ('b1000006-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000006', barber_program_id,
     'Professional conduct & ethics', 'Demonstrate punctuality, dress code compliance, and client confidentiality', 5)
  ON CONFLICT (id) DO NOTHING;

  -- ── Area 7: Anatomy, Physiology & Theory (RTI) ────────────────────────────
  INSERT INTO public.apprentice_skills (id, category_id, program_id, name, description, "order")
  VALUES
    ('b1000007-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Hair & scalp anatomy', 'Structure of hair follicle, shaft, bulb, sebaceous gland — RTI module', 1),
    ('b1000007-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Skin anatomy & disorders', 'Layers of skin, common disorders, contraindications for service — RTI module', 2),
    ('b1000007-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Chemistry of hair services', 'pH scale, oxidation, reduction, and chemical reactions in color/relaxer/perm — RTI module', 3),
    ('b1000007-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Indiana barber law & rules', 'Indiana PLA statutes, shop licensing, apprenticeship rules, scope of practice — RTI module', 4),
    ('b1000007-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Electricity & light therapy', 'Electrical safety, galvanic current, high-frequency, UV sterilization — RTI module', 5),
    ('b1000007-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000007', barber_program_id,
     'Business & shop management', 'Booth rental vs. employment, taxes, licensing, insurance basics — RTI module', 6)
  ON CONFLICT (id) DO NOTHING;

END $$;
