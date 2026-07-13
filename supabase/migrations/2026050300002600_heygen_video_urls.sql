-- Wire 7 identified HeyGen videos to their course_lessons rows.
-- Videos transcribed via Whisper and matched to lesson content.
-- Files copied to public/hvac/videos/ with lesson UUID filenames.

UPDATE course_lessons SET video_url = '/hvac/videos/lesson-2f172cb2-4657-5460-9b93-f9b062ad8dd2.mp4', duration_minutes = 5 WHERE id = '2f172cb2-4657-5460-9b93-f9b062ad8dd2';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-96576bf0-cbd5-581f-99aa-f36e48e694fd.mp4', duration_minutes = 5 WHERE id = '96576bf0-cbd5-581f-99aa-f36e48e694fd';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56.mp4', duration_minutes = 5 WHERE id = 'ee8c4e3a-b1c6-51bf-acd5-2836c8b16e56';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-baed04b3-35ae-51c7-a325-c678fbd0e725.mp4', duration_minutes = 3 WHERE id = 'baed04b3-35ae-51c7-a325-c678fbd0e725';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-dba03432-fb85-5f6f-bc69-4cc785a7904a.mp4', duration_minutes = 2 WHERE id = 'dba03432-fb85-5f6f-bc69-4cc785a7904a';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-4097148b-7a06-5784-9807-5e3470d4c091.mp4', duration_minutes = 2 WHERE id = '4097148b-7a06-5784-9807-5e3470d4c091';
UPDATE course_lessons SET video_url = '/hvac/videos/lesson-5c5b516c-2e7c-5cae-8231-1f4483c1a912.mp4', duration_minutes = 2 WHERE id = '5c5b516c-2e7c-5cae-8231-1f4483c1a912';
