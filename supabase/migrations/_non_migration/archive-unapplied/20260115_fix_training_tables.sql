-- Fix training_courses and training_lessons tables
-- Run this migration to create proper schema for courses

-- Drop existing tables if they exist (they're empty anyway)
DROP TABLE IF EXISTS training_lessons CASCADE;
DROP TABLE IF EXISTS training_courses CASCADE;

-- Create training_courses table
CREATE TABLE training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  lessons_count INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  image_url TEXT,
  video_intro_url TEXT,
  is_active BOOLEAN DEFAULT true,
  program_id UUID REFERENCES programs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create training_lessons table
CREATE TABLE training_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES training_courses(course_id) ON DELETE CASCADE,
  lesson_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  video_url TEXT,
  video_duration_seconds INTEGER,
  duration_minutes INTEGER DEFAULT 15,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, lesson_number)
);

-- Create indexes
CREATE INDEX idx_training_courses_active ON training_courses(is_active);
CREATE INDEX idx_training_courses_category ON training_courses(category);
CREATE INDEX idx_training_courses_program ON training_courses(program_id);
CREATE INDEX idx_training_lessons_course ON training_lessons(course_id);

-- Enable RLS
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;

-- Public read access for active courses
CREATE POLICY "Public can view active courses" ON training_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view lessons" ON training_lessons
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins can manage courses" ON training_courses
  FOR ALL USING (true);

CREATE POLICY "Admins can manage lessons" ON training_lessons
  FOR ALL USING (true);
