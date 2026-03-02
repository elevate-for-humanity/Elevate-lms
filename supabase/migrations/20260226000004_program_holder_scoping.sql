-- Program-scoped access for program holders.
--
-- Live schema reality:
--   programs: NO created_by, NO owner_id
--   program_holders: user_id (nullable), NO owner_id, NO program_id
--   program_holder_students: program_holder_id, student_id, program_id (nullable)
--   profiles: program_holder_id (FK to program_holders.id)
--
-- Ownership path:
--   profiles.program_holder_id → program_holders.id
--     → program_holder_programs.program_holder_id → program_holder_programs.program_id
--     → programs.id

-- ============================================================
-- 1. program_holder_programs: direct holder ↔ program association
-- ============================================================
CREATE TABLE IF NOT EXISTS public.program_holder_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id UUID NOT NULL REFERENCES public.program_holders(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  role_in_program TEXT NOT NULL DEFAULT 'owner',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (program_holder_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_php_holder ON public.program_holder_programs(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_php_program ON public.program_holder_programs(program_id);

-- ============================================================
-- 2. Backfill from program_holder_students (best-effort)
-- ============================================================
INSERT INTO public.program_holder_programs (program_holder_id, program_id)
SELECT DISTINCT phs.program_holder_id, phs.program_id
FROM public.program_holder_students phs
WHERE phs.program_id IS NOT NULL
  AND phs.program_holder_id IS NOT NULL
ON CONFLICT (program_holder_id, program_id) DO NOTHING;

-- ============================================================
-- 3. programs_for_holder view — single query for portal pages
-- ============================================================
CREATE OR REPLACE VIEW public.programs_for_holder AS
SELECT
  php.program_holder_id,
  php.role_in_program,
  php.status AS association_status,
  p.*
FROM public.program_holder_programs php
JOIN public.programs p ON p.id = php.program_id
WHERE php.status = 'active';

-- ============================================================
-- 4. Enforce program_id NOT NULL on future inserts
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_null_program_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.program_id IS NULL THEN
    RAISE EXCEPTION 'program_id cannot be null in program_holder_students';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_prevent_null_program_id ON public.program_holder_students;

CREATE TRIGGER trg_prevent_null_program_id
BEFORE INSERT OR UPDATE ON public.program_holder_students
FOR EACH ROW EXECUTE FUNCTION public.prevent_null_program_id();

-- ============================================================
-- 5. RLS on program_holder_programs
-- ============================================================
ALTER TABLE public.program_holder_programs ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's program_holder_id
CREATE OR REPLACE FUNCTION public.current_program_holder_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT program_holder_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Holders see their own program associations
DROP POLICY IF EXISTS "holders_own_programs" ON public.program_holder_programs;
CREATE POLICY "holders_own_programs" ON public.program_holder_programs
  FOR SELECT USING (
    program_holder_id = public.current_program_holder_id()
  );

-- Admins/staff can manage all
DROP POLICY IF EXISTS "admins_manage_php" ON public.program_holder_programs;
CREATE POLICY "admins_manage_php" ON public.program_holder_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================
-- 6. RLS on program_holder_students
-- ============================================================
ALTER TABLE public.program_holder_students ENABLE ROW LEVEL SECURITY;

-- Holders see students in their programs
DROP POLICY IF EXISTS "holders_see_own_students" ON public.program_holder_students;
CREATE POLICY "holders_see_own_students" ON public.program_holder_students
  FOR SELECT USING (
    program_holder_id = public.current_program_holder_id()
  );

-- Students see their own enrollment rows
DROP POLICY IF EXISTS "students_see_own_enrollment" ON public.program_holder_students;
CREATE POLICY "students_see_own_enrollment" ON public.program_holder_students
  FOR SELECT USING (
    student_id = auth.uid()
  );

-- Admins/staff can manage all
DROP POLICY IF EXISTS "admins_manage_phs" ON public.program_holder_students;
CREATE POLICY "admins_manage_phs" ON public.program_holder_students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================================
-- 7. RLS on program_holders
-- ============================================================
ALTER TABLE public.program_holders ENABLE ROW LEVEL SECURITY;

-- Holders see their own row
DROP POLICY IF EXISTS "holders_see_own" ON public.program_holders;
CREATE POLICY "holders_see_own" ON public.program_holders
  FOR SELECT USING (
    id = public.current_program_holder_id()
  );

-- Admins/staff can manage all
DROP POLICY IF EXISTS "admins_manage_holders" ON public.program_holders;
CREATE POLICY "admins_manage_holders" ON public.program_holders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff')
    )
  );
