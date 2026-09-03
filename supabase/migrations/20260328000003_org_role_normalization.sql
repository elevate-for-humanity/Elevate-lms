-- Normalize organization_users.role values before applying the canonical constraint.
--
-- Canonical role set (matches org-guard.ts ORG_ROLE_HIERARCHY):
--   report_viewer | instructor | reviewer | org_admin | org_owner
--
-- Mapping from legacy values:
--   owner        → org_owner
--   admin        → org_admin
--   org_admin    → org_admin   (already canonical)
--   org_owner    → org_owner   (already canonical)
--   super_admin  → org_owner   (platform admins get top org role)
--   member       → report_viewer
--   viewer       → report_viewer
--   instructor   → instructor  (already canonical)
--   reviewer     → reviewer    (already canonical)
--   report_viewer→ report_viewer (already canonical)
--
-- Rows with unmappable roles are set to report_viewer and flagged in
-- a quarantine log so they can be reviewed manually.

-- Step 1: Create quarantine log for unmappable rows (idempotent)
CREATE TABLE IF NOT EXISTS public.org_role_normalization_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  user_id         uuid,
  original_role   text,
  assigned_role   text NOT NULL DEFAULT 'report_viewer',
  logged_at       timestamptz NOT NULL DEFAULT now()
);

-- Step 2: Log rows that will be force-mapped (not in any known set)
INSERT INTO public.org_role_normalization_log (organization_id, user_id, original_role)
SELECT organization_id, user_id, role
FROM public.organization_users
WHERE role NOT IN (
  'org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer',
  'owner', 'admin', 'super_admin', 'member', 'viewer'
);

-- Step 3: Apply known mappings
UPDATE public.organization_users
SET role = CASE role
  WHEN 'owner'       THEN 'org_owner'
  WHEN 'admin'       THEN 'org_admin'
  WHEN 'super_admin' THEN 'org_owner'
  WHEN 'member'      THEN 'report_viewer'
  WHEN 'viewer'      THEN 'report_viewer'
  ELSE role  -- org_owner, org_admin, instructor, reviewer, report_viewer pass through
END
WHERE role IN (
  'owner', 'admin', 'super_admin', 'member', 'viewer',
  'org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer'
);

-- Step 4: Force-map any remaining unknown roles to report_viewer
UPDATE public.organization_users
SET role = 'report_viewer'
WHERE role NOT IN (
  'org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer'
);

-- Step 5: Now safe to apply the constraint
ALTER TABLE public.organization_users
  DROP CONSTRAINT IF EXISTS organization_users_role_check;

ALTER TABLE public.organization_users
  DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE public.organization_users
  ADD CONSTRAINT organization_users_role_check
  CHECK (role IN ('org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer'));

-- Step 6: Also normalize org_invites.role to the same vocabulary
-- (invites written before this migration may have used legacy values)
UPDATE public.org_invites
SET role = CASE role
  WHEN 'owner'       THEN 'org_owner'
  WHEN 'admin'       THEN 'org_admin'
  WHEN 'super_admin' THEN 'org_owner'
  WHEN 'member'      THEN 'report_viewer'
  WHEN 'viewer'      THEN 'report_viewer'
  ELSE role
END
WHERE role NOT IN (
  'org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer'
);

-- Force-map any remaining unknown invite roles
UPDATE public.org_invites
SET role = 'report_viewer'
WHERE role NOT IN (
  'org_owner', 'org_admin', 'instructor', 'reviewer', 'report_viewer'
);
