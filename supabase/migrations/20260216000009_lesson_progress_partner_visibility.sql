-- Migration: Add partner visibility to lesson_progress
-- Partners can see progress for students placed at their shop(s).
-- Chain: lesson_progress → training_enrollments(user_id) →
--        apprentice_placements(student_id, shop_id) →
--        shop_staff(shop_id, user_id = current partner)
-- All scoped to same tenant.

BEGIN;

-- Drop any existing partner policy
DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM training_enrollments te
      JOIN apprentice_placements ap ON ap.student_id = te.user_id
                                    AND ap.tenant_id = te.tenant_id
                                    AND ap.status = 'active'
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE te.id = lesson_progress.enrollment_id
        AND te.tenant_id = lesson_progress.tenant_id
        AND ss.user_id = auth.uid()
    )
  );

-- Also add partner read to training_enrollments if missing
DROP POLICY IF EXISTS "training_enrollments_partner_read" ON training_enrollments;

CREATE POLICY "training_enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE ap.student_id = training_enrollments.user_id
        AND ap.tenant_id = training_enrollments.tenant_id
        AND ap.status = 'active'
        AND ss.user_id = auth.uid()
    )
  );

-- Performance indexes for the join chain
CREATE INDEX IF NOT EXISTS idx_apprentice_placements_student_shop
  ON apprentice_placements(student_id, shop_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_shop
  ON shop_staff(user_id, shop_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment
  ON lesson_progress(enrollment_id);

COMMIT;
