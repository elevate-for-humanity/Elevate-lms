-- Barber Apprenticeship: Practical Requirements Engine
--
-- Tracks required service counts per student.
-- No instructor approval = no credit. Count only increments on approval.
--
-- Required counts (Indiana DOL / NIC exam alignment):
--   haircut_standard:   75  (Module 4)
--   haircut_fade:       50  (Module 4)
--   haircut_advanced:   25  (Module 4)
--   shave_straight:     40  (Module 5)
--   beard_trim:         40  (Module 5)
--   chemical_service:   20  (Module 6)
--   scalp_treatment:    10  (Module 2)
--   tool_maintenance:   10  (Module 3)

-- Practical category definitions (single source of truth)
CREATE TABLE IF NOT EXISTS public.barber_practical_categories (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key    text  NOT NULL UNIQUE,
  label           text  NOT NULL,
  module_number   int   NOT NULL CHECK (module_number BETWEEN 1 AND 8),
  count_required  int   NOT NULL CHECK (count_required > 0),
  description     text
);

ALTER TABLE public.barber_practical_categories ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE;

-- Ensure barber_practical_submissions has required columns
ALTER TABLE public.barber_practical_submissions
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

INSERT INTO public.barber_practical_categories
  (category_key, label, required_count, description)
VALUES
  ('haircut_standard', 'Standard Haircut', 75, 'Full haircut service on a live client — scissor or clipper'),
  ('haircut_fade', 'Fade Haircut', 50, 'Low, mid, or high fade on a live client'),
  ('haircut_advanced', 'Advanced Style', 25, 'Textured cut, design, or specialty style on a live client'),
  ('shave_straight', 'Straight Razor Shave', 40, 'Full straight razor shave on a live client'),
  ('beard_trim', 'Beard Trim / Design', 40, 'Beard trim, shape, or design on a live client'),
  ('chemical_service', 'Chemical Service', 20, 'Color, relaxer, or texturizer application on a live client'),
  ('scalp_treatment', 'Scalp Treatment', 10, 'Scalp analysis and treatment service'),
  ('tool_maintenance', 'Tool Maintenance', 10, 'Documented clipper/scissor cleaning and calibration')
ON CONFLICT (category_key) DO UPDATE SET
  required_count = EXCLUDED.required_count,
  label          = EXCLUDED.label;

-- Per-student practical progress
CREATE TABLE IF NOT EXISTS public.barber_student_practicals (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          uuid         NOT NULL,
  category_key        text         NOT NULL REFERENCES public.barber_practical_categories(category_key),

  count_completed     int          NOT NULL DEFAULT 0 CHECK (count_completed >= 0),
  count_required      int          NOT NULL,  -- denormalized from category for fast reads
  last_verified_by    uuid,        -- instructor UUID
  last_verified_at    timestamptz,
  verification_status text         NOT NULL DEFAULT 'in_progress'
                        CHECK (verification_status IN ('in_progress', 'met', 'waived')),
  updated_at          timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_practicals_user
  ON public.barber_student_practicals(user_id, program_id);

-- Individual practical submission log (one row per submitted service)
CREATE TABLE IF NOT EXISTS public.barber_practical_submissions (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id      uuid         NOT NULL,
  category_key    text         NOT NULL REFERENCES public.barber_practical_categories(category_key),

  -- Evidence
  notes           text,
  photo_url       text,        -- Supabase storage path
  video_url       text,
  client_initials text,        -- privacy-safe client identifier
  service_date    date         NOT NULL DEFAULT CURRENT_DATE,
  shop_name       text,

  -- Review
  status          text         NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     uuid,        -- instructor UUID
  reviewed_at     timestamptz,
  rejection_reason text,

  submitted_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_barber_practical_submissions_user
  ON public.barber_practical_submissions(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_barber_practical_submissions_pending
  ON public.barber_practical_submissions(status)
  WHERE status = 'pending';

-- Function: approve a submission → increment count, update ledger
CREATE OR REPLACE FUNCTION public.approve_barber_practical(
  p_submission_id uuid,
  p_instructor_id uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_sub   public.barber_practical_submissions%ROWTYPE;
  v_cat   public.barber_practical_categories%ROWTYPE;
  v_req   int;
BEGIN
  -- Lock and fetch submission
  SELECT * INTO v_sub FROM public.barber_practical_submissions
  WHERE id = p_submission_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already reviewed';
  END IF;

  SELECT * INTO v_cat FROM public.barber_practical_categories
  WHERE category_key = v_sub.category_key;

  -- Mark submission approved
  UPDATE public.barber_practical_submissions SET
    status      = 'approved',
    reviewed_by = p_instructor_id,
    reviewed_at = now()
  WHERE id = p_submission_id;

  -- Upsert student practical progress
  INSERT INTO public.barber_student_practicals
    (user_id, program_id, category_key, count_completed, required_count, last_verified_by, last_verified_at, verification_status)
  VALUES
    (v_sub.user_id, v_sub.program_id, v_sub.category_key, 1, v_cat.required_count, p_instructor_id, now(), 'in_progress')
  ON CONFLICT (user_id, program_id, category_key) DO UPDATE SET
    count_completed  = barber_student_practicals.count_completed + 1,
    last_verified_by = p_instructor_id,
    last_verified_at = now(),
    verification_status = CASE
      WHEN barber_student_practicals.count_completed + 1 >= barber_student_practicals.required_count
      THEN 'met' ELSE 'in_progress' END,
    updated_at = now();
END;
$$;

-- RLS
ALTER TABLE public.barber_practical_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_student_practicals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_practical_submissions   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads categories"         ON public.barber_practical_categories;
CREATE POLICY "Public reads categories"
  ON public.barber_practical_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Student reads own practicals"    ON public.barber_student_practicals;
DROP POLICY IF EXISTS "Service role full practicals"    ON public.barber_student_practicals;
CREATE POLICY "Student reads own practicals"
  ON public.barber_student_practicals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full practicals"
  ON public.barber_student_practicals USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Student reads own submissions"   ON public.barber_practical_submissions;
DROP POLICY IF EXISTS "Student inserts own submissions" ON public.barber_practical_submissions;
DROP POLICY IF EXISTS "Service role full submissions"   ON public.barber_practical_submissions;
CREATE POLICY "Student reads own submissions"
  ON public.barber_practical_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Student inserts own submissions"
  ON public.barber_practical_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full submissions"
  ON public.barber_practical_submissions USING (auth.role() = 'service_role');

