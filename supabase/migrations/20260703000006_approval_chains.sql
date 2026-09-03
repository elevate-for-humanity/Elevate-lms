-- Approval chains: multi-step approval orchestration for publishing,
-- enrollment decisions, and governance actions.
--
-- approval_chain_definitions  — reusable templates (e.g. "course publish", "enrollment approve")
-- approval_chain_instances    — one per entity being approved (e.g. course_id=X)
-- approval_chain_steps        — ordered steps within an instance, one per approver
--
-- Idempotent — safe to re-run.

-- ── Definitions ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.approval_chain_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,          -- e.g. 'course_publish', 'enrollment_approve'
  description  text,
  entity_type  text NOT NULL,                 -- 'course', 'enrollment', 'program', etc.
  steps        jsonb NOT NULL DEFAULT '[]',   -- [{role, label, required}]
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ── Instances ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.approval_chain_instances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_id   uuid NOT NULL REFERENCES public.approval_chain_definitions(id) ON DELETE CASCADE,
  entity_type     text NOT NULL,
  entity_id       uuid NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'cancelled')),
  initiated_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  initiated_at    timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  rejection_reason text,
  metadata        jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS approval_chain_instances_entity_idx
  ON public.approval_chain_instances (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS approval_chain_instances_status_idx
  ON public.approval_chain_instances (status)
  WHERE status IN ('pending', 'in_progress');

-- ── Steps ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.approval_chain_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id     uuid NOT NULL REFERENCES public.approval_chain_instances(id) ON DELETE CASCADE,
  step_order      integer NOT NULL DEFAULT 0,
  role_required   text NOT NULL,              -- role that must approve this step
  label           text NOT NULL,              -- e.g. 'Instructor Review', 'Admin Approval'
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')),
  actor_id        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role      text,
  decided_at      timestamptz,
  notes           text
);

CREATE INDEX IF NOT EXISTS approval_chain_steps_instance_idx
  ON public.approval_chain_steps (instance_id, step_order);

-- ── Seed: course publish chain ────────────────────────────────────────────────
INSERT INTO public.approval_chain_definitions (name, description, entity_type, steps)
VALUES (
  'course_publish',
  'Two-step approval before a course goes live: instructor review then admin sign-off.',
  'course',
  '[
    {"step_order": 1, "role_required": "staff",       "label": "Instructor Review", "required": true},
    {"step_order": 2, "role_required": "admin",        "label": "Admin Approval",    "required": true}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.approval_chain_definitions (name, description, entity_type, steps)
VALUES (
  'enrollment_approve',
  'Single-step admin approval for enrollment applications.',
  'enrollment',
  '[
    {"step_order": 1, "role_required": "admin", "label": "Admin Approval", "required": true}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- RLS: admins and super_admins can read/write all; staff can read
ALTER TABLE public.approval_chain_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_chain_instances   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_chain_steps       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_definitions" ON public.approval_chain_definitions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_full_access_instances" ON public.approval_chain_instances
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_full_access_steps" ON public.approval_chain_steps
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
