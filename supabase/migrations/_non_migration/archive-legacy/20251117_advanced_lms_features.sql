-- =====================================================
-- ADVANCED LMS FEATURES - DATABASE SCHEMA
-- =====================================================
-- Created: 2025-11-17
-- Purpose: Course Authoring, Content Library, Competencies, etc.
-- =====================================================

-- =====================================================
-- 1. COURSE AUTHORING & CONTENT LIBRARY
-- =====================================================

-- Content Library Items
CREATE TABLE IF NOT EXISTS content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(100) NOT NULL, -- video, document, image, audio, scorm, interactive, quiz
  
  -- File Details
  file_url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  duration_seconds INTEGER, -- For video/audio
  
  -- Metadata
  tags TEXT[], -- Array of tags
  category VARCHAR(100),
  difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
  language VARCHAR(10) DEFAULT 'en',
  
  -- Licensing
  license_type VARCHAR(100), -- creative_commons, proprietary, public_domain
  copyright_info TEXT,
  
  -- Usage
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  
  -- Author
  created_by UUID REFERENCES profiles(id),
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Templates
CREATE TABLE IF NOT EXISTS course_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  
  -- Template Structure (JSON)
  structure JSONB NOT NULL, -- Modules, lessons, activities structure
  
  -- Settings
  default_settings JSONB, -- Default course settings
  
  -- Usage
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson Content Blocks (for drag-and-drop builder)
CREATE TABLE IF NOT EXISTS lesson_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  
  -- Block Details
  block_type VARCHAR(100) NOT NULL, -- text, video, image, quiz, interactive, embed, file, code
  block_order INTEGER NOT NULL,
  
  -- Content (stored as JSON for flexibility)
  content JSONB NOT NULL,
  
  -- Settings
  settings JSONB, -- Block-specific settings
  
  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interactive Elements
CREATE TABLE IF NOT EXISTS interactive_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_block_id UUID REFERENCES lesson_content_blocks(id) ON DELETE CASCADE,
  
  -- Element Details
  element_type VARCHAR(100) NOT NULL, -- hotspot, branching, drag_drop, simulation, timeline
  element_data JSONB NOT NULL,
  
  -- Tracking
  completion_required BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. COMPETENCY FRAMEWORK & SKILLS TRACKING
-- =====================================================

-- Competencies
CREATE TABLE IF NOT EXISTS competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competency_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- technical, soft_skills, leadership, domain_specific
  
  -- Hierarchy
  parent_competency_id UUID REFERENCES competencies(id),
  
  -- Levels
  proficiency_levels JSONB, -- Array of levels: beginner, intermediate, advanced, expert
  
  -- Industry Standards
  industry_standard VARCHAR(100), -- O*NET, ESCO, custom
  standard_code VARCHAR(100),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Competencies Mapping
CREATE TABLE IF NOT EXISTS course_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  competency_id UUID REFERENCES competencies(id),
  
  -- Target Level
  target_proficiency_level VARCHAR(50), -- What level this course aims to achieve
  
  -- Weight
  weight DECIMAL(5,2) DEFAULT 1.0, -- How much this competency is emphasized
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(course_id, competency_id)
);

-- Student Competency Progress
CREATE TABLE IF NOT EXISTS student_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  competency_id UUID REFERENCES competencies(id),
  
  -- Current Level
  current_level VARCHAR(50), -- beginner, intermediate, advanced, expert
  proficiency_score DECIMAL(5,2), -- 0-100
  
  -- Evidence
  evidence_count INTEGER DEFAULT 0,
  last_demonstrated_at TIMESTAMPTZ,
  
  -- Progress
  courses_completed INTEGER DEFAULT 0,
  assessments_passed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, competency_id)
);

-- Competency Evidence
CREATE TABLE IF NOT EXISTS competency_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_competency_id UUID REFERENCES student_competencies(id) ON DELETE CASCADE,
  
  -- Evidence Details
  evidence_type VARCHAR(100), -- course_completion, assessment, project, certification, work_experience
  evidence_source_id UUID, -- ID of course, assessment, etc.
  evidence_source_type VARCHAR(100),
  
  -- Score/Rating
  score DECIMAL(5,2),
  
  -- Verification
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. PEER REVIEW SYSTEM
-- =====================================================

-- Peer Review Assignments
CREATE TABLE IF NOT EXISTS peer_review_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  
  -- Review Settings
  reviews_required INTEGER DEFAULT 3, -- How many peer reviews each submission needs
  review_deadline TIMESTAMPTZ,
  
  -- Rubric
  rubric JSONB, -- Review criteria and scoring
  
  -- Anonymity
  anonymous_reviews BOOLEAN DEFAULT true,
  
  -- Grading
  peer_review_weight DECIMAL(5,2) DEFAULT 0.3, -- Weight of peer reviews in final grade
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer Reviews
CREATE TABLE IF NOT EXISTS peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  peer_review_assignment_id UUID REFERENCES peer_review_assignments(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  
  -- Review Content
  scores JSONB, -- Scores for each rubric criterion
  overall_score DECIMAL(5,2),
  feedback TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, flagged
  submitted_at TIMESTAMPTZ,
  
  -- Quality Check
  helpful_votes INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ADAPTIVE LEARNING ENGINE
-- =====================================================

-- Learning Paths (AI-generated)
CREATE TABLE IF NOT EXISTS adaptive_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  
  -- Path Details
  path_name VARCHAR(255),
  goal_description TEXT,
  target_competencies UUID[], -- Array of competency IDs
  
  -- AI Recommendations
  recommended_courses UUID[], -- Array of course IDs in order
  recommended_resources UUID[], -- Array of content library IDs
  
  -- Personalization
  learning_style VARCHAR(100), -- visual, auditory, kinesthetic, reading_writing
  difficulty_preference VARCHAR(50), -- challenging, moderate, easy
  pace_preference VARCHAR(50), -- fast, moderate, slow
  
  -- Progress
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- active, completed, paused, abandoned
  
  -- AI Model Info
  model_version VARCHAR(50),
  confidence_score DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Analytics (for AI)
CREATE TABLE IF NOT EXISTS learning_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id),
  
  -- Engagement Metrics
  total_time_spent_minutes INTEGER DEFAULT 0,
  avg_session_duration_minutes DECIMAL(10,2),
  login_frequency DECIMAL(5,2), -- Logins per week
  
  -- Performance Metrics
  avg_quiz_score DECIMAL(5,2),
  avg_assignment_score DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  
  -- Behavior Patterns
  preferred_content_types TEXT[], -- video, text, interactive, etc.
  peak_learning_hours INTEGER[], -- Hours of day when most active
  struggle_areas TEXT[], -- Topics where student struggles
  
  -- Predictions
  at_risk_score DECIMAL(5,2), -- 0-100, higher = more at risk
  predicted_completion_date DATE,
  recommended_interventions TEXT[],
  
  -- Metadata
  last_calculated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id)
);

-- =====================================================
-- 5. PROCTORING SYSTEM
-- =====================================================

-- Proctored Exams
CREATE TABLE IF NOT EXISTS proctored_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  
  -- Proctoring Settings
  proctoring_type VARCHAR(100), -- live, recorded, ai_automated, lockdown_browser
  require_id_verification BOOLEAN DEFAULT false,
  require_room_scan BOOLEAN DEFAULT false,
  
  -- Monitoring
  monitor_webcam BOOLEAN DEFAULT true,
  monitor_screen BOOLEAN DEFAULT true,
  monitor_audio BOOLEAN DEFAULT false,
  
  -- Restrictions
  disable_copy_paste BOOLEAN DEFAULT true,
  disable_right_click BOOLEAN DEFAULT true,
  block_new_tabs BOOLEAN DEFAULT true,
  block_external_apps BOOLEAN DEFAULT true,
  
  -- AI Detection
  detect_multiple_faces BOOLEAN DEFAULT true,
  detect_phone_usage BOOLEAN DEFAULT true,
  detect_looking_away BOOLEAN DEFAULT true,
  
  -- Scheduling
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proctoring Sessions
CREATE TABLE IF NOT EXISTS proctoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proctored_exam_id UUID REFERENCES proctored_exams(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  
  -- Session Details
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  
  -- Recordings
  video_recording_url TEXT,
  screen_recording_url TEXT,
  
  -- ID Verification
  id_photo_url TEXT,
  id_verified BOOLEAN DEFAULT false,
  
  -- Incidents
  incidents_detected INTEGER DEFAULT 0,
  incident_log JSONB, -- Array of incidents with timestamps
  
  -- Review
  flagged_for_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,
  review_decision VARCHAR(50), -- approved, suspicious, cheating_detected
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, completed, terminated
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. ADVANCED FORUMS & SOCIAL LEARNING
-- =====================================================

-- Forum Categories
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(50),
  
  -- Hierarchy
  parent_category_id UUID REFERENCES forum_categories(id),
  
  -- Permissions
  allowed_roles TEXT[], -- Array of roles that can post
  
  -- Settings
  requires_moderation BOOLEAN DEFAULT false,
  
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Threads (extends existing forums table)
CREATE TABLE IF NOT EXISTS forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES forum_categories(id),
  course_id UUID REFERENCES courses(id), -- Optional: course-specific threads
  
  -- Thread Details
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  
  -- Status
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  moderated_by UUID REFERENCES profiles(id),
  moderation_notes TEXT,
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Tags
  tags TEXT[],
  
  -- Last Activity
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  last_reply_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Replies
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES forum_replies(id), -- For nested replies
  
  -- Reply Content
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  
  -- Status
  is_solution BOOLEAN DEFAULT false, -- Marked as solution by thread author
  is_approved BOOLEAN DEFAULT true,
  
  -- Engagement
  like_count INTEGER DEFAULT 0,
  
  -- Moderation
  flagged BOOLEAN DEFAULT false,
  flag_count INTEGER DEFAULT 0,
  moderated_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forum Reactions
CREATE TABLE IF NOT EXISTS forum_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  
  -- Target
  target_type VARCHAR(50), -- thread, reply
  target_id UUID NOT NULL,
  
  -- Reaction
  reaction_type VARCHAR(50), -- like, helpful, insightful, thanks
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, target_type, target_id, reaction_type)
);

-- =====================================================
-- 7. LIVE CLASSES & VIRTUAL CLASSROOMS
-- =====================================================

-- Live Classes
CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  
  -- Class Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES profiles(id),
  
  -- Schedule
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  
  -- Platform
  platform VARCHAR(100), -- zoom, teams, google_meet, custom
  meeting_url TEXT,
  meeting_id VARCHAR(255),
  meeting_password VARCHAR(255),
  
  -- Settings
  max_participants INTEGER,
  require_registration BOOLEAN DEFAULT false,
  allow_recording BOOLEAN DEFAULT true,
  
  -- Recording
  recording_url TEXT,
  recording_duration_minutes INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  
  -- Attendance
  attendance_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Live Class Attendance
CREATE TABLE IF NOT EXISTS live_class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id),
  
  -- Attendance Details
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Engagement
  questions_asked INTEGER DEFAULT 0,
  polls_answered INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  
  -- Status
  attendance_status VARCHAR(50), -- present, absent, late, left_early
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. ACCESSIBILITY FEATURES
-- =====================================================

-- Accessibility Preferences
CREATE TABLE IF NOT EXISTS accessibility_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  
  -- Visual
  high_contrast BOOLEAN DEFAULT false,
  large_text BOOLEAN DEFAULT false,
  font_size INTEGER DEFAULT 16,
  dyslexia_friendly_font BOOLEAN DEFAULT false,
  
  -- Audio
  captions_enabled BOOLEAN DEFAULT false,
  caption_language VARCHAR(10) DEFAULT 'en',
  audio_descriptions BOOLEAN DEFAULT false,
  
  -- Navigation
  keyboard_navigation BOOLEAN DEFAULT false,
  screen_reader_optimized BOOLEAN DEFAULT false,
  
  -- Content
  simplified_language BOOLEAN DEFAULT false,
  reduce_animations BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video Captions
CREATE TABLE IF NOT EXISTS video_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_url TEXT NOT NULL,
  language VARCHAR(10) NOT NULL,
  
  -- Caption Data
  captions_vtt TEXT, -- WebVTT format
  captions_srt TEXT, -- SRT format
  
  -- Generation
  auto_generated BOOLEAN DEFAULT false,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(video_url, language)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_content_library_type ON content_library(content_type);
CREATE INDEX idx_content_library_tags ON content_library USING GIN(tags);
CREATE INDEX idx_content_library_status ON content_library(status);

CREATE INDEX idx_lesson_blocks_lesson ON lesson_content_blocks(lesson_id);
CREATE INDEX idx_lesson_blocks_order ON lesson_content_blocks(lesson_id, block_order);

CREATE INDEX idx_competencies_parent ON competencies(parent_competency_id);
CREATE INDEX idx_student_competencies_student ON student_competencies(student_id);

CREATE INDEX idx_peer_reviews_submission ON peer_reviews(submission_id);
CREATE INDEX idx_peer_reviews_reviewer ON peer_reviews(reviewer_id);

CREATE INDEX idx_forum_threads_category ON forum_threads(category_id);
CREATE INDEX idx_forum_threads_course ON forum_threads(course_id);
CREATE INDEX idx_forum_threads_activity ON forum_threads(last_activity_at DESC);

CREATE INDEX idx_forum_replies_thread ON forum_replies(thread_id);
CREATE INDEX idx_forum_replies_parent ON forum_replies(parent_reply_id);

CREATE INDEX idx_live_classes_course ON live_classes(course_id);
CREATE INDEX idx_live_classes_schedule ON live_classes(scheduled_start);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_sessions ENABLE ROW LEVEL SECURITY;

-- Public content is visible to all
CREATE POLICY content_library_public ON content_library FOR SELECT USING (is_public = true);

-- Authors can manage their own content
CREATE POLICY content_library_authors ON content_library FOR ALL USING (created_by = auth.uid());

-- Students can see their own competencies
CREATE POLICY student_competencies_own ON student_competencies FOR SELECT USING (student_id = auth.uid());

-- Forum threads are public within courses
CREATE POLICY forum_threads_public ON forum_threads FOR SELECT USING (true);

-- Users can create threads
CREATE POLICY forum_threads_create ON forum_threads FOR INSERT WITH CHECK (author_id = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER update_content_library_updated_at BEFORE UPDATE ON content_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_threads_updated_at BEFORE UPDATE ON forum_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETE
-- =====================================================
