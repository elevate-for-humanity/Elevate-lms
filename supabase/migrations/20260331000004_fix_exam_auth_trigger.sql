-- Fix exam_authorizations.credential_id FK and trigger.
--
-- exam_authorizations.credential_id was defined as REFERENCES credentials(id)
-- (learner credential instances). An authorization-to-sit record should reference
-- the credential definition in credential_registry, not a learner instance that
-- doesn't exist yet at authorization time.
--
-- Changes:
--   1. Drop the wrong FK on credential_id, add correct FK -> credential_registry
--   2. Make credential_id nullable (authorization precedes credential issuance)
--   3. Add pathway_id column if absent
--   4. Replace trigger function to resolve credential_id from program_credentials

ALTER TABLE exam_authorizations
  DROP CONSTRAINT IF EXISTS exam_authorizations_credential_id_fkey;

ALTER TABLE exam_authorizations
  ADD CONSTRAINT exam_authorizations_credential_id_fkey
    FOREIGN KEY (credential_id) REFERENCES credential_registry(id) ON DELETE SET NULL;

ALTER TABLE exam_authorizations
  ALTER COLUMN credential_id DROP NOT NULL;

ALTER TABLE exam_authorizations
  ADD COLUMN IF NOT EXISTS pathway_id uuid
    REFERENCES program_certification_pathways(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION auto_create_exam_authorization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_program_id    uuid;
  v_readiness     exam_readiness_result;
  v_pathway_id    uuid;
  v_credential_id uuid;
  v_enrollment_id uuid;
BEGIN
  SELECT cl.program_id INTO v_program_id
  FROM curriculum_lessons cl WHERE cl.id = NEW.lesson_id;

  IF v_program_id IS NULL THEN RETURN NEW; END IF;

  IF NOT EXISTS (SELECT 1 FROM program_exam_ready_rules WHERE program_id = v_program_id) THEN
    RETURN NEW;
  END IF;

  v_readiness := evaluate_exam_readiness(NEW.user_id, v_program_id);
  IF NOT v_readiness.is_ready THEN RETURN NEW; END IF;

  IF EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id = NEW.user_id AND program_id = v_program_id
      AND status NOT IN ('expired', 'revoked')
  ) THEN RETURN NEW; END IF;

  SELECT id INTO v_pathway_id
  FROM program_certification_pathways
  WHERE program_id = v_program_id AND is_primary = true AND is_active = true
  LIMIT 1;

  IF v_pathway_id IS NULL THEN RETURN NEW; END IF;

  SELECT credential_id INTO v_credential_id
  FROM program_credentials
  WHERE program_id = v_program_id AND is_primary = true
  LIMIT 1;

  SELECT id INTO v_enrollment_id
  FROM program_enrollments
  WHERE user_id = NEW.user_id AND program_id = v_program_id AND status = 'active'
  LIMIT 1;

  INSERT INTO exam_authorizations (
    user_id, program_id, credential_id, enrollment_id, pathway_id,
    status, authorized_at, expires_at, notes
  )
  SELECT
    NEW.user_id, v_program_id, v_credential_id, v_enrollment_id, v_pathway_id,
    'authorized', now(), now() + interval '180 days',
    format('Auto-authorized: avg %s%%, min %s%%, %s/%s checkpoints passed',
      v_readiness.avg_checkpoint_score, v_readiness.min_checkpoint_score,
      v_readiness.checkpoints_passed, v_readiness.checkpoints_total)
  WHERE NOT EXISTS (
    SELECT 1 FROM exam_authorizations
    WHERE user_id = NEW.user_id AND program_id = v_program_id
      AND status NOT IN ('expired', 'revoked')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_exam_authorization ON checkpoint_scores;
CREATE TRIGGER trg_auto_exam_authorization
  AFTER INSERT ON checkpoint_scores
  FOR EACH ROW EXECUTE FUNCTION auto_create_exam_authorization();
