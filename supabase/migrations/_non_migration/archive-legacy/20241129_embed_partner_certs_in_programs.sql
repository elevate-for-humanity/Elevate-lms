-- ============================================================================
-- EMBED PARTNER CERTIFICATIONS IN PROGRAMS
-- Partner micro-courses become required certifications within YOUR programs
-- ============================================================================

-- Add required certifications to programs
CREATE TABLE IF NOT EXISTS program_required_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  partner_course_id UUID NOT NULL REFERENCES partner_courses(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 1,
  must_complete_before_graduation BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_certs_program ON program_required_certifications(program_id);
CREATE INDEX IF NOT EXISTS idx_program_certs_course ON program_required_certifications(partner_course_id);

-- Track student completion of required certifications
CREATE TABLE IF NOT EXISTS student_certification_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  partner_course_id UUID NOT NULL REFERENCES partner_courses(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'payment_pending', 'enrolled', 'in_progress', 'completed')),
  partner_enrollment_id UUID REFERENCES partner_lms_enrollments(id),
  payment_completed_at TIMESTAMPTZ,
  course_started_at TIMESTAMPTZ,
  course_completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id, partner_course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_cert_progress_user ON student_certification_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_cert_progress_program ON student_certification_progress(program_id);

-- Add certification requirements to modules (optional - for organizing where certs appear)
ALTER TABLE modules
ADD COLUMN IF NOT EXISTS requires_certification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS certification_partner_course_id UUID REFERENCES partner_courses(id);

-- View to see program completion including required certs
CREATE OR REPLACE VIEW program_completion_with_certs AS
SELECT 
  e.id as enrollment_id,
  e.user_id,
  e.program_id,
  p.title as program_title,
  
  -- Lesson progress
  COUNT(DISTINCT l.id) as total_lessons,
  COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) as completed_lessons,
  
  -- Required certifications
  COUNT(DISTINCT prc.id) as total_required_certs,
  COUNT(DISTINCT CASE WHEN scp.status = 'completed' THEN prc.id END) as completed_certs,
  
  -- Overall completion
  CASE 
    WHEN COUNT(DISTINCT l.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END)::DECIMAL / 
       COUNT(DISTINCT l.id) * 100), 2
    )
  END as lesson_completion_percentage,
  
  CASE 
    WHEN COUNT(DISTINCT prc.id) = 0 THEN 100
    ELSE ROUND(
      (COUNT(DISTINCT CASE WHEN scp.status = 'completed' THEN prc.id END)::DECIMAL / 
       COUNT(DISTINCT prc.id) * 100), 2
    )
  END as cert_completion_percentage,
  
  -- Can graduate?
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN lp.status = 'completed' THEN l.id END) = COUNT(DISTINCT l.id)
     AND (COUNT(DISTINCT prc.id) = 0 OR COUNT(DISTINCT CASE WHEN scp.status = 'completed' THEN prc.id END) = COUNT(DISTINCT prc.id))
    THEN true
    ELSE false
  END as can_graduate

FROM enrollments e
JOIN programs p ON p.id = e.program_id
LEFT JOIN lessons l ON l.program_id = e.program_id
LEFT JOIN lesson_progress lp ON lp.enrollment_id = e.id AND lp.lesson_id = l.id
LEFT JOIN program_required_certifications prc ON prc.program_id = e.program_id
LEFT JOIN student_certification_progress scp ON scp.user_id = e.user_id 
  AND scp.program_id = e.program_id 
  AND scp.partner_course_id = prc.partner_course_id
WHERE e.status = 'active'
GROUP BY e.id, e.user_id, e.program_id, p.title;

-- Example: Add CPR certification as requirement for Medical Assistant
-- Run this after you have programs and partner courses set up:
/*
INSERT INTO program_required_certifications (program_id, partner_course_id, order_index, must_complete_before_graduation)
SELECT 
  p.id,
  pc.id,
  1,
  true
FROM programs p
CROSS JOIN partner_courses pc
WHERE p.slug = 'medical-assistant'
  AND pc.course_code = 'HSI-CPR-AED'
LIMIT 1;
*/

COMMENT ON TABLE program_required_certifications IS 'Partner certifications required to complete a program';
COMMENT ON TABLE student_certification_progress IS 'Track student progress on required partner certifications';
COMMENT ON VIEW program_completion_with_certs IS 'Complete view of program progress including required certifications';
