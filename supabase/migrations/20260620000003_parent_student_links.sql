-- Parent/guardian → student relationship table for the parent portal.
-- parent_id and student_id both reference auth.users (via profiles).

CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship    TEXT NOT NULL DEFAULT 'guardian',
  verified        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

-- Index for parent lookups
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent_id
  ON public.parent_student_links(parent_id);

-- Index for student lookups (e.g. "who are my guardians?")
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student_id
  ON public.parent_student_links(student_id);

-- RLS: parents can only see their own links
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent_student_links_select_own"
  ON public.parent_student_links FOR SELECT
  USING (auth.uid() = parent_id OR auth.uid() = student_id);

CREATE POLICY "parent_student_links_insert_own"
  ON public.parent_student_links FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "parent_student_links_delete_own"
  ON public.parent_student_links FOR DELETE
  USING (auth.uid() = parent_id);
