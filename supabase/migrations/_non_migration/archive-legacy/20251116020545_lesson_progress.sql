-- Track student video lesson progress
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  student_id uuid NOT NULL,
  course_id bigint,
  lesson_id bigint NOT NULL,

  duration_seconds integer,
  watched_seconds integer,
  completed boolean NOT NULL DEFAULT false,

  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT lesson_progress_unique UNIQUE (student_id, lesson_id)
);

-- Add foreign key to auth.users (adjust if using profiles table)
ALTER TABLE public.lesson_progress
  ADD CONSTRAINT lesson_progress_student_fkey
  FOREIGN KEY (student_id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Optional: Add FK to lessons table if it exists
-- ALTER TABLE public.lesson_progress
--   ADD CONSTRAINT lesson_progress_lesson_fkey
--   FOREIGN KEY (lesson_id) REFERENCES public.lessons (id) ON DELETE CASCADE;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_timestamp_lesson_progress ON public.lesson_progress;

CREATE TRIGGER set_timestamp_lesson_progress
BEFORE UPDATE ON public.lesson_progress
FOR EACH ROW
EXECUTE PROCEDURE public.set_timestamp();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_lesson_progress_student ON public.lesson_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON public.lesson_progress(completed);

-- Enable RLS
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Students can only see/update their own progress
CREATE POLICY "Students can view own progress"
  ON public.lesson_progress
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own progress"
  ON public.lesson_progress
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own progress"
  ON public.lesson_progress
  FOR UPDATE
  USING (auth.uid() = student_id);

-- Admin/staff can view all progress
CREATE POLICY "Admins can view all progress"
  ON public.lesson_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'staff', 'instructor')
    )
  );
