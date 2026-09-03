-- Phase 5 Step 1: Partner multi-tenant org model
-- Applied directly to DB via management API 2026-03-28.
-- This file documents what was applied.

-- 1. Normalize organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS org_type text CHECK (org_type IN (
    'elevate','training_partner','credentialing_body','employer','testing_site'
  )),
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.organizations
SET org_type = CASE type WHEN 'training_provider' THEN 'training_partner' ELSE type END
WHERE org_type IS NULL;

-- 2. Normalize organization_users
-- Add status column. Role constraint is applied in 20260328000003 after
-- data normalization — do not add it here.
ALTER TABLE public.organization_users
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','invited','suspended','removed'));

-- 3. program_organizations
CREATE TABLE IF NOT EXISTS public.program_organizations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN (
    'owner','delivery_partner','testing_partner',
    'credential_partner','apprenticeship_partner'
  )),
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
  UNIQUE (program_id, organization_id, relationship_type)
);
ALTER TABLE public.program_organizations ENABLE ROW LEVEL SECURITY;

-- 4. cohorts: add organization_id + delivery_mode
ALTER TABLE public.cohorts
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_mode text CHECK (delivery_mode IN (
    'in_person','hybrid','online','self_paced'
  ));

-- 5. cohort_enrollments
CREATE TABLE IF NOT EXISTS public.cohort_enrollments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id         uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  learner_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_status text NOT NULL DEFAULT 'enrolled' CHECK (enrollment_status IN (
    'invited','enrolled','active','completed','withdrawn','no_show'
  )),
  enrolled_at       timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
  UNIQUE (cohort_id, learner_id)
);
ALTER TABLE public.cohort_enrollments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_cohort_enrollments_cohort  ON cohort_enrollments (cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_enrollments_learner ON cohort_enrollments (learner_id);

-- 6. Extend canonical org_invites table.
-- org_invites is the single canonical invite table. org_invitations is NOT created.
ALTER TABLE public.org_invites
  ADD COLUMN IF NOT EXISTS cohort_id   uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_org_invites_cohort ON public.org_invites (cohort_id)
  WHERE cohort_id IS NOT NULL;
