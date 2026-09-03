-- ============================================================================
-- STUDENT REQUIREMENTS SEED DATA
-- Real requirements for demo students
-- ============================================================================

-- ============================================================================
-- MARCUS JOHNSON - BARBERING (On Track - 60% Complete)
-- ============================================================================

-- Completed Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000001',
    'document',
    'Upload State ID or Driver License',
    'Required for enrollment verification and background check',
    (NOW() - INTERVAL '3 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000001',
    'document',
    'Submit High School Diploma or GED',
    'Educational prerequisite for barbering program',
    (NOW() - INTERVAL '3 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '3 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000001',
    'course',
    'Complete Sanitation & Safety Module',
    'OSHA-compliant safety training for barbering',
    (NOW() - INTERVAL '2 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '2 weeks'
  )
ON CONFLICT DO NOTHING;

-- Pending Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000001',
    'hours',
    'Log 40 Practice Hours - Basic Cuts',
    'Document practice hours for clipper cuts and basic styling',
    (NOW() + INTERVAL '1 week')::date,
    'high',
    'in_progress',
    NOW() - INTERVAL '2 weeks',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000001',
    'appointment',
    'Schedule Mid-Program Check-In',
    'Meet with instructor to review progress and address questions',
    (NOW() + INTERVAL '2 weeks')::date,
    'normal',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SARAH WILLIAMS - HVAC (On Track - 75% Complete)
-- ============================================================================

-- Completed Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000002',
    'document',
    'Upload State ID or Driver License',
    'Required for enrollment verification',
    (NOW() - INTERVAL '5 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '6 weeks',
    NOW() - INTERVAL '5 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'course',
    'Complete HVAC Fundamentals',
    'Introduction to heating, ventilation, and air conditioning systems',
    (NOW() - INTERVAL '4 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '6 weeks',
    NOW() - INTERVAL '4 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'course',
    'Complete Electrical Systems Module',
    'Understanding electrical components in HVAC systems',
    (NOW() - INTERVAL '2 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '4 weeks',
    NOW() - INTERVAL '2 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'hours',
    'Log 60 Lab Hours - System Installation',
    'Hands-on practice installing HVAC systems',
    (NOW() - INTERVAL '1 week')::date,
    'high',
    'completed',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '1 week'
  )
ON CONFLICT DO NOTHING;

-- Pending Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000002',
    'evaluation',
    'EPA 608 Certification Exam',
    'Required certification for handling refrigerants',
    (NOW() + INTERVAL '3 weeks')::date,
    'urgent',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- JAMES DAVIS - CDL (Needs Action - 40% Complete, 1 Overdue)
-- ============================================================================

-- Completed Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000003',
    'document',
    'Upload Commercial Learner Permit (CLP)',
    'Required before behind-the-wheel training',
    (NOW() - INTERVAL '2 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '2 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'course',
    'Complete CDL Written Test Prep',
    'Preparation for general knowledge, air brakes, and combination vehicles',
    (NOW() - INTERVAL '1 week')::date,
    'high',
    'verified',
    NOW() - INTERVAL '3 weeks',
    NOW() - INTERVAL '1 week'
  )
ON CONFLICT DO NOTHING;

-- Overdue Requirement
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000003',
    'document',
    'Submit DOT Medical Examination Certificate',
    'Required medical clearance for commercial driving',
    (NOW() - INTERVAL '3 days')::date,
    'urgent',
    'pending',
    NOW() - INTERVAL '2 weeks',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Pending Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000003',
    'hours',
    'Log 40 Behind-the-Wheel Hours',
    'Supervised driving practice with certified instructor',
    (NOW() + INTERVAL '2 weeks')::date,
    'high',
    'pending',
    NOW() - INTERVAL '1 week',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'evaluation',
    'Pass Pre-Trip Inspection Test',
    'Demonstrate ability to conduct thorough vehicle inspection',
    (NOW() + INTERVAL '3 weeks')::date,
    'high',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MARIA GARCIA - MEDICAL ASSISTANT (At Risk - 25% Complete, 2 Overdue)
-- ============================================================================

-- Completed Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000004',
    'document',
    'Upload State ID or Driver License',
    'Required for enrollment verification',
    (NOW() - INTERVAL '7 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '8 weeks',
    NOW() - INTERVAL '7 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'course',
    'Complete Medical Terminology',
    'Foundation course for medical assistant training',
    (NOW() - INTERVAL '5 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '8 weeks',
    NOW() - INTERVAL '5 weeks'
  )
ON CONFLICT DO NOTHING;

-- Overdue Requirements (Critical)
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000004',
    'document',
    'Submit Immunization Records',
    'Required for clinical placement - TB test, Hepatitis B, MMR, Varicella',
    (NOW() - INTERVAL '2 weeks')::date,
    'urgent',
    'pending',
    NOW() - INTERVAL '6 weeks',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'document',
    'Complete Background Check Authorization',
    'Required for clinical site placement',
    (NOW() - INTERVAL '1 week')::date,
    'urgent',
    'pending',
    NOW() - INTERVAL '5 weeks',
    NOW()
  )
ON CONFLICT DO NOTHING;

-- Pending Requirements
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000004',
    'course',
    'Complete Clinical Procedures Module',
    'Vital signs, injections, phlebotomy, EKG',
    (NOW() + INTERVAL '1 week')::date,
    'high',
    'pending',
    NOW() - INTERVAL '4 weeks',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'hours',
    'Log 160 Clinical Externship Hours',
    'Supervised clinical experience at healthcare facility',
    (NOW() + INTERVAL '4 weeks')::date,
    'urgent',
    'pending',
    NOW() - INTERVAL '3 weeks',
    NOW()
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'appointment',
    'Schedule Academic Advising Session',
    'Discuss progress and create success plan',
    (NOW() + INTERVAL '3 days')::date,
    'urgent',
    'pending',
    NOW(),
    NOW()
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROBERT MILLER - WELDING (Completed - 100%)
-- ============================================================================

-- All Requirements Verified
INSERT INTO student_requirements (
  enrollment_id, requirement_type, title, description, 
  due_date, priority, status, created_at, updated_at
) VALUES 
  (
    '40000000-0000-0000-0000-000000000005',
    'document',
    'Upload State ID or Driver License',
    'Required for enrollment verification',
    (NOW() - INTERVAL '15 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '16 weeks',
    NOW() - INTERVAL '15 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'course',
    'Complete Welding Safety Certification',
    'OSHA-compliant safety training',
    (NOW() - INTERVAL '14 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '16 weeks',
    NOW() - INTERVAL '14 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'course',
    'Complete MIG Welding Module',
    'Metal Inert Gas welding techniques',
    (NOW() - INTERVAL '12 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '15 weeks',
    NOW() - INTERVAL '12 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'course',
    'Complete TIG Welding Module',
    'Tungsten Inert Gas welding techniques',
    (NOW() - INTERVAL '10 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '13 weeks',
    NOW() - INTERVAL '10 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'course',
    'Complete Stick Welding Module',
    'Shielded Metal Arc Welding (SMAW)',
    (NOW() - INTERVAL '8 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '11 weeks',
    NOW() - INTERVAL '8 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'hours',
    'Log 200 Practice Hours',
    'Supervised welding practice across all techniques',
    (NOW() - INTERVAL '4 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '10 weeks',
    NOW() - INTERVAL '4 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'evaluation',
    'Pass AWS D1.1 Certification Test',
    'American Welding Society structural welding certification',
    (NOW() - INTERVAL '2 weeks')::date,
    'urgent',
    'verified',
    NOW() - INTERVAL '6 weeks',
    NOW() - INTERVAL '2 weeks'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'document',
    'Submit Final Project Portfolio',
    'Documentation of completed welding projects',
    (NOW() - INTERVAL '2 weeks')::date,
    'high',
    'verified',
    NOW() - INTERVAL '4 weeks',
    NOW() - INTERVAL '2 weeks'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Student requirements seed data loaded';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STUDENT STATUS SUMMARY:';
  RAISE NOTICE '  • Marcus Johnson (Barbering): 60%% complete, ON TRACK';
  RAISE NOTICE '  • Sarah Williams (HVAC): 75%% complete, ON TRACK';
  RAISE NOTICE '  • James Davis (CDL): 40%% complete, NEEDS ACTION (1 overdue)';
  RAISE NOTICE '  • Maria Garcia (Medical Assistant): 25%% complete, AT RISK (2 overdue)';
  RAISE NOTICE '  • Robert Miller (Welding): 100%% complete, COMPLETED';
END $$;
