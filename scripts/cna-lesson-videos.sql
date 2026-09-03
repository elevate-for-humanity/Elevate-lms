
-- CNA Module 1 Lesson Videos
-- Generated: 2025-12-02T18:16:47.757Z
-- This script inserts/updates video URLs for CNA Module 1 lessons


-- Lesson 1: Program Orientation & Introduction
INSERT INTO lessons (id, course_id, title, "order", duration, video_url, content, created_at)
VALUES (
  'cna-lesson-1',
  'cna-module-1',
  'Program Orientation & Introduction',
  1,
  600,
  '/videos/about-section-video-with-narration.mp4',
  '<h2>Program Orientation & Introduction</h2><p>This lesson covers essential program orientation & introduction concepts for CNAs.</p>',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration;


-- Lesson 2: Healthcare Basics & Medical Terminology
INSERT INTO lessons (id, course_id, title, "order", duration, video_url, content, created_at)
VALUES (
  'cna-lesson-2',
  'cna-module-1',
  'Healthcare Basics & Medical Terminology',
  2,
  720,
  '/videos/about-section-video-with-narration.mp4',
  '<h2>Healthcare Basics & Medical Terminology</h2><p>This lesson covers essential healthcare basics & medical terminology concepts for CNAs.</p>',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration;


-- Lesson 3: Patient Safety & Infection Control
INSERT INTO lessons (id, course_id, title, "order", duration, video_url, content, created_at)
VALUES (
  'cna-lesson-3',
  'cna-module-1',
  'Patient Safety & Infection Control',
  3,
  900,
  '/videos/about-section-video-with-narration.mp4',
  '<h2>Patient Safety & Infection Control</h2><p>This lesson covers essential patient safety & infection control concepts for CNAs.</p>',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration;


-- Lesson 4: Infection Control Procedures
INSERT INTO lessons (id, course_id, title, "order", duration, video_url, content, created_at)
VALUES (
  'cna-lesson-4',
  'cna-module-1',
  'Infection Control Procedures',
  4,
  720,
  '/videos/about-section-video-with-narration.mp4',
  '<h2>Infection Control Procedures</h2><p>This lesson covers essential infection control procedures concepts for CNAs.</p>',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration;


-- Lesson 5: Communication Skills in Healthcare
INSERT INTO lessons (id, course_id, title, "order", duration, video_url, content, created_at)
VALUES (
  'cna-lesson-5',
  'cna-module-1',
  'Communication Skills in Healthcare',
  5,
  600,
  '/videos/about-section-video-with-narration.mp4',
  '<h2>Communication Skills in Healthcare</h2><p>This lesson covers essential communication skills in healthcare concepts for CNAs.</p>',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  video_url = EXCLUDED.video_url,
  duration = EXCLUDED.duration;


-- Verify insertion
SELECT id, title, video_url, duration FROM lessons WHERE course_id = 'cna-module-1' ORDER BY "order";
