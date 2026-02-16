-- ============================================================================
-- Performance Indexes for Elevate for Humanity
-- Optimize common query patterns
-- ============================================================================

-- Speed up course enrollment checks
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_course
  ON course_enrollments(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_tenant
  ON course_enrollments(tenant_id, created_at DESC);

-- Speed up completion checks
CREATE INDEX IF NOT EXISTS idx_course_completions_user_course
  ON course_completions(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_course_completions_tenant_date
  ON course_completions(tenant_id, completed_at DESC);

-- Speed up tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_programs_tenant
  ON programs(tenant_id, is_published);

CREATE INDEX IF NOT EXISTS idx_users_tenant
  ON profiles(tenant_id, created_at DESC);

-- Speed up course searches
CREATE INDEX IF NOT EXISTS idx_courses_published
  ON courses(is_published, created_at DESC) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_courses_tenant_published
  ON courses(tenant_id, is_published, created_at DESC);

-- Full-text search on courses
CREATE INDEX IF NOT EXISTS idx_courses_title_search
  ON courses USING gin(to_tsvector('english', title));

CREATE INDEX IF NOT EXISTS idx_courses_description_search
  ON courses USING gin(to_tsvector('english', description));

-- Speed up grade lookups
CREATE INDEX IF NOT EXISTS idx_grades_user_course
  ON grades(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_grades_enrollment
  ON grades(enrollment_id, created_at DESC);

-- Speed up assignment submissions
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user
  ON assignment_submissions(user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment
  ON assignment_submissions(assignment_id, submitted_at DESC);

-- Speed up attendance tracking
CREATE INDEX IF NOT EXISTS idx_attendance_user_date
  ON attendance_records(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_course_date
  ON attendance_records(course_id, date DESC);

-- Speed up certificate generation
CREATE INDEX IF NOT EXISTS idx_certificates_user
  ON certificates(user_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_certificates_course
  ON certificates(course_id, issued_at DESC);

-- Speed up notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- Speed up message queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient
  ON messages(recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_id, created_at DESC);

-- Composite indexes for common joins
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status
  ON course_enrollments(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrollments_course_status
  ON course_enrollments(course_id, status, created_at DESC);

-- HR system indexes
CREATE INDEX IF NOT EXISTS idx_employees_tenant_active
  ON employees(tenant_id, is_active, hire_date DESC);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_period
  ON payroll_records(employee_id, pay_period_start DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_status
  ON leave_requests(employee_id, status, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_time_entries_employee_date
  ON time_entries(employee_id, date DESC);

-- Marketing indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_status
  ON marketing_campaigns(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_email
  ON marketing_contacts(tenant_id, email);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_tenant_date
  ON events(tenant_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_event
  ON event_registrations(event_id, registered_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user
  ON event_registrations(user_id, registered_at DESC);

-- Add comments for documentation
COMMENT ON INDEX idx_course_enrollments_user_course IS 'Optimize enrollment status checks';
COMMENT ON INDEX idx_courses_title_search IS 'Full-text search on course titles';
COMMENT ON INDEX idx_employees_tenant_active IS 'Optimize active employee queries';

-- Analyze tables to update statistics
ANALYZE courses;
ANALYZE course_enrollments;
ANALYZE course_completions;
ANALYZE profiles;
ANALYZE programs;
ANALYZE grades;
ANALYZE employees;
ANALYZE marketing_campaigns;
ANALYZE events;
