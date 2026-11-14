-- Program holder operational tables:
-- students roster, attendance, milestones, payout schedule

-- ─── program_holder_students ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.program_holder_students (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id   UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id       UUID REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','completed','withdrawn','on_hold')),
  enrolled_at         TIMESTAMPTZ DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_holder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ph_students_holder  ON public.program_holder_students(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_students_user    ON public.program_holder_students(user_id);

ALTER TABLE public.program_holder_students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "program_holder_students_select" ON public.program_holder_students
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "program_holder_students_insert" ON public.program_holder_students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "program_holder_students_update" ON public.program_holder_students
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ─── attendance_records ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id   UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  session_date        DATE NOT NULL,
  session_type        TEXT NOT NULL DEFAULT 'classroom'
                        CHECK (session_type IN ('classroom','hands_on','lab','field','online','makeup')),
  hours               NUMERIC(4,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'present'
                        CHECK (status IN ('present','absent','excused','late','partial')),
  notes               TEXT,
  document_url        TEXT,
  recorded_by         UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_holder  ON public.attendance_records(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user    ON public.attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON public.attendance_records(session_date);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_select" ON public.attendance_records
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "attendance_insert" ON public.attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "attendance_update" ON public.attendance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ─── student_milestones ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.student_milestones (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id   UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id          UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  milestone_type      TEXT NOT NULL
                        CHECK (milestone_type IN (
                          'enrollment','orientation','week_1','week_2','week_3',
                          'week_4','week_5','week_6','hands_on_complete',
                          'epa_608_passed','osha_10_passed','cpr_passed',
                          'program_complete','job_placement'
                        )),
  title               TEXT NOT NULL,
  completed           BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  document_url        TEXT,
  notes               TEXT,
  verified_by         UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_milestones_holder ON public.student_milestones(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user   ON public.student_milestones(user_id);

ALTER TABLE public.student_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "milestones_select" ON public.student_milestones
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "milestones_insert" ON public.student_milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
CREATE POLICY "milestones_update" ON public.student_milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

-- ─── payout_schedules ────────────────────────────────────────────────────────
-- Tracks the 2-increment payment schedule per student per program holder.
-- First 2 students: 100% upfront. Subsequent: 50% on approval, 50% on completion.
CREATE TABLE IF NOT EXISTS public.payout_schedules (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_holder_id     UUID REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id         UUID REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  program_id            UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  student_sequence      INTEGER,           -- 1, 2 = first cohort (upfront); 3+ = split
  total_payout_cents    INTEGER NOT NULL DEFAULT 0,
  increment_1_cents     INTEGER NOT NULL DEFAULT 0,
  increment_2_cents     INTEGER NOT NULL DEFAULT 0,
  increment_1_status    TEXT NOT NULL DEFAULT 'pending'
                          CHECK (increment_1_status IN ('pending','approved','released','paid','held')),
  increment_2_status    TEXT NOT NULL DEFAULT 'pending'
                          CHECK (increment_2_status IN ('pending','approved','released','paid','held','not_applicable')),
  increment_1_approved_at   TIMESTAMPTZ,
  increment_1_release_date  DATE,          -- 14 days after approval
  increment_1_paid_at       TIMESTAMPTZ,
  increment_2_approved_at   TIMESTAMPTZ,
  increment_2_release_date  DATE,          -- 14 days after completion approval
  increment_2_paid_at       TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (program_holder_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_schedules_holder ON public.payout_schedules(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_payout_schedules_user   ON public.payout_schedules(user_id);

ALTER TABLE public.payout_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_schedules_select" ON public.payout_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id AND ph.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );
