-- Reconcile learner credential lifecycle metadata and activate native badges
-- only for credentials owned by an internal credentialing partner.

ALTER TABLE learner_credentials
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE credentials c
SET
  open_badges_enabled = true,
  open_badges_version = COALESCE(c.open_badges_version, '3.0'),
  achievement_type = COALESCE(c.achievement_type, 'Certificate'),
  achievement_criteria_narrative = COALESCE(
    c.achievement_criteria_narrative,
    'Awarded after the learner successfully completes the applicable Elevate for Humanity program or course requirements.'
  ),
  issuing_authority = COALESCE(c.issuing_authority, cp.name)
FROM credentialing_partners cp
WHERE c.partner_id = cp.id
  AND cp.type = 'internal';
