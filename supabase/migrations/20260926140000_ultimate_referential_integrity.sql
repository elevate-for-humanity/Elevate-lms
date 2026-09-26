-- Ultimate Course Builder referential-integrity hardening.
-- Stable platform identities use FKs. Generated instructional IDs remain inside
-- versioned artifacts/traceability so they do not become competing authorities.

ALTER TABLE public.ultimate_course_builds
  ADD CONSTRAINT ultimate_course_builds_course_fk
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT;

ALTER TABLE public.ultimate_course_builds
  ADD CONSTRAINT ultimate_course_builds_status_check
  CHECK (status IN ('initializing','queued','running','built','built_with_findings','failed','published','archived'));

ALTER TABLE public.ultimate_lesson_builds
  ADD CONSTRAINT ultimate_lesson_builds_status_check
  CHECK (status IN ('queued','running','built','built_with_findings','failed'));

ALTER TABLE public.ultimate_lesson_steps
  ADD CONSTRAINT ultimate_lesson_steps_state_check
  CHECK (state IN ('pending','running','passed','failed'));

ALTER TABLE public.ultimate_objective_mastery
  ADD CONSTRAINT ultimate_mastery_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT ultimate_mastery_course_fk
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT,
  ADD CONSTRAINT ultimate_mastery_lesson_fk
  FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  ADD CONSTRAINT ultimate_mastery_state_check
  CHECK (state IN ('not_started','in_progress','needs_remediation','mastered')),
  ADD CONSTRAINT ultimate_mastery_score_check
  CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  ADD CONSTRAINT ultimate_mastery_attempts_check
  CHECK (attempts >= 0 AND remediation_count >= 0);

ALTER TABLE public.ultimate_remediation_events
  ADD CONSTRAINT ultimate_remediation_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE RESTRICT,
  ADD CONSTRAINT ultimate_remediation_course_fk
  FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE RESTRICT,
  ADD CONSTRAINT ultimate_remediation_lesson_fk
  FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  ADD CONSTRAINT ultimate_remediation_status_check
  CHECK (status IN ('assigned','in_progress','reassessing','completed','cancelled'));

ALTER TABLE public.ultimate_blueprints
  ADD CONSTRAINT ultimate_blueprints_created_by_fk
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT ultimate_blueprints_approved_by_fk
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.ultimate_artifact_versions
  ADD CONSTRAINT ultimate_artifact_versions_locked_by_fk
  FOREIGN KEY (locked_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT ultimate_artifact_versions_approved_by_fk
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT ultimate_artifact_versions_version_check CHECK (version > 0);

ALTER TABLE public.ultimate_review_decisions
  ADD CONSTRAINT ultimate_review_decisions_reviewer_fk
  FOREIGN KEY (reviewer_id) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- Preserve evidence lineage. A dependency may not point to itself.
ALTER TABLE public.ultimate_artifact_dependencies
  ADD CONSTRAINT ultimate_artifact_dependency_not_self
  CHECK (artifact_version_id <> depends_on_version_id);

CREATE INDEX IF NOT EXISTS ultimate_course_builds_course_idx ON public.ultimate_course_builds(course_id);
CREATE INDEX IF NOT EXISTS ultimate_mastery_course_lesson_idx ON public.ultimate_objective_mastery(course_id,lesson_id);
CREATE INDEX IF NOT EXISTS ultimate_remediation_course_lesson_idx ON public.ultimate_remediation_events(course_id,lesson_id);
CREATE INDEX IF NOT EXISTS ultimate_blueprints_build_status_idx ON public.ultimate_blueprints(build_id,status);
CREATE INDEX IF NOT EXISTS ultimate_review_artifact_idx ON public.ultimate_review_decisions(artifact_version_id,created_at);

-- Prevent accidental deletion of a course build once durable historical evidence
-- exists. Archive at the application level instead of deleting audit history.
CREATE OR REPLACE FUNCTION public.guard_ultimate_build_delete()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.ultimate_artifacts WHERE build_id=OLD.id)
     OR EXISTS (SELECT 1 FROM public.ultimate_requirement_traceability WHERE build_id=OLD.id)
     OR EXISTS (SELECT 1 FROM public.ultimate_blueprints WHERE build_id=OLD.id AND status='approved') THEN
    RAISE EXCEPTION 'ULTIMATE_BUILD_HAS_AUDIT_EVIDENCE: archive instead of delete';
  END IF;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS ultimate_guard_build_delete ON public.ultimate_course_builds;
CREATE TRIGGER ultimate_guard_build_delete
BEFORE DELETE ON public.ultimate_course_builds
FOR EACH ROW EXECUTE FUNCTION public.guard_ultimate_build_delete();
