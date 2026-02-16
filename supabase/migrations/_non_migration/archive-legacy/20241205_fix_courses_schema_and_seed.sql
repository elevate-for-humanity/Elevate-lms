-- Fix courses table schema and add seed data
-- Run this in Supabase SQL Editor

-- Add missing fields to courses table
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS duration_hours INTEGER,
  ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'all'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_moderation_status 
  ON courses (moderation_status);

CREATE INDEX IF NOT EXISTS idx_courses_category 
  ON courses (category);

CREATE INDEX IF NOT EXISTS idx_courses_level 
  ON courses (level);

-- Insert sample courses (will be replaced with real data)
INSERT INTO courses (
  title, 
  slug, 
  description, 
  duration_weeks, 
  moderation_status, 
  category, 
  level, 
  thumbnail_url,
  duration_hours
)
VALUES
  (
    'Certified Nursing Assistant (CNA) Training',
    'cna-training',
    'Fast-track CNA training that prepares you for entry-level roles in long-term care, hospitals, and home health. 100% free through WIOA funding.',
    6,
    'approved',
    'Healthcare',
    'beginner',
    '/images/programs/efh-cna-hero.jpg',
    120
  ),
  (
    'HVAC Technician Training',
    'hvac-technician',
    'Learn to keep homes, schools, and businesses comfortable year-round. Hands-on training in heating, ventilation, and air conditioning systems.',
    12,
    'approved',
    'Skilled Trades',
    'intermediate',
    '/images/programs/hvac-hero.jpg',
    480
  ),
  (
    'Barber Apprenticeship',
    'barber-apprenticeship',
    'Earn while you learn through a licensed barber apprenticeship. Real shop experience and preparation for state licensure.',
    52,
    'approved',
    'Beauty & Wellness',
    'beginner',
    '/images/programs/barber-hero.jpg',
    1500
  ),
  (
    'Commercial Driver''s License (CDL) Training',
    'cdl-training',
    'Professional CDL training that prepares you for Class A or Class B licensing and entry-level commercial driving careers.',
    8,
    'approved',
    'Transportation',
    'beginner',
    '/images/programs/cdl-hero.jpg',
    160
  ),
  (
    'Building Maintenance Technician',
    'building-maintenance',
    'Hands-on training for individuals seeking roles in building repair, maintenance, and facility operations.',
    10,
    'approved',
    'Skilled Trades',
    'beginner',
    '/images/programs/building-maintenance-hero.jpg',
    200
  ),
  (
    'Workforce Readiness Training',
    'workforce-readiness',
    'A job-readiness program that builds the essential skills needed to succeed in employment, training, and career advancement.',
    4,
    'approved',
    'Career Development',
    'all',
    '/images/programs/efh-building-tech-hero.jpg',
    40
  )
ON CONFLICT (slug) DO UPDATE SET
  description = EXCLUDED.description,
  duration_weeks = EXCLUDED.duration_weeks,
  moderation_status = EXCLUDED.moderation_status,
  category = EXCLUDED.category,
  level = EXCLUDED.level,
  thumbnail_url = EXCLUDED.thumbnail_url,
  duration_hours = EXCLUDED.duration_hours,
  updated_at = NOW();

-- Verify the data
SELECT 
  id, 
  title, 
  slug,
  moderation_status, 
  category, 
  level,
  duration_weeks,
  duration_hours,
  thumbnail_url 
FROM courses 
WHERE moderation_status = 'approved'
ORDER BY title;
