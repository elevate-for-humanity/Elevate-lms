-- Migration: program_builder_columns
-- Adds phase_id to program_modules (multi-phase curriculum support)
-- Adds is_published to program_lessons (per-lesson publish state)
-- Adds program_phases table as the grouping layer

-- ── 1. program_phases ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.program_phases (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID    NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_phases_program_id
  ON public.program_phases(program_id, sort_order);

ALTER TABLE public.program_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phases_read" ON public.program_phases
  FOR SELECT USING (true);

CREATE POLICY "phases_admin_all" ON public.program_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ── 2. phase_id on program_modules ───────────────────────────────────────────

ALTER TABLE public.program_modules
  ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.program_phases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_program_modules_phase_id
  ON public.program_modules(phase_id);

-- ── 3. is_published on program_lessons ───────────────────────────────────────

ALTER TABLE public.program_lessons
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_program_lessons_published
  ON public.program_lessons(module_id, is_published);

-- ── 4. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.program_phases TO authenticated;
GRANT ALL    ON public.program_phases TO service_role;
