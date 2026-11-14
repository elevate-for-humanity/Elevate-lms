-- Fix: rename old orientation video path to canonical new path
-- Old generator output: /videos/barber-course-intro-with-voice.mp4 (file never existed)
-- New generator output: /videos/barber-lessons/barber-apprenticeship-intro.mp4
UPDATE public.curriculum_lessons
SET video_file = '/videos/barber-lessons/barber-apprenticeship-intro.mp4'
WHERE video_file = '/videos/barber-course-intro-with-voice.mp4';
