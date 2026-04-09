-- Backfill video_url and video_config.videoFile on barber course_lessons rows
-- that were seeded before blueprint videoFile entries were added.
--
-- Blueprint videoFile mapping (42 lessons → 14 distinct shared videos):
--   Lessons without a per-lesson MP4 (6–49) get the thematically closest shared video.
--   Lessons 1–5 already have per-lesson MP4s; this sets video_url as a belt-and-suspenders
--   fallback for any rows that were seeded without it.

DO $$
DECLARE
  barber_course_id uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

  -- slug → videoFile mapping from blueprint
  mapping jsonb := '{
    "barber-lesson-1":  "/videos/barber-course-intro-with-voice.mp4",
    "barber-lesson-2":  "/videos/course-barber-sanitation-narrated.mp4",
    "barber-lesson-3":  "/videos/course-barber-sanitation.mp4",
    "barber-lesson-4":  "/videos/course-barber-sanitation-narrated.mp4",
    "barber-lesson-5":  "/videos/course-barber-sanitation-narrated.mp4",
    "barber-lesson-6":  "/videos/course-barber-sanitation-narrated.mp4",
    "barber-lesson-8":  "/videos/course-barber-consultation-narrated.mp4",
    "barber-lesson-9":  "/videos/course-barber-consultation-narrated.mp4",
    "barber-lesson-10": "/videos/course-barber-consultation-narrated.mp4",
    "barber-lesson-11": "/videos/course-barber-shampoo-narrated.mp4",
    "barber-lesson-12": "/videos/course-barber-consultation-narrated.mp4",
    "barber-lesson-13": "/videos/course-barber-shampoo-narrated.mp4",
    "barber-lesson-15": "/videos/course-barber-clipper-techniques.mp4",
    "barber-lesson-16": "/videos/course-barber-scissors-narrated.mp4",
    "barber-lesson-17": "/videos/course-barber-razor-narrated.mp4",
    "barber-lesson-18": "/videos/course-barber-clipper-techniques.mp4",
    "barber-lesson-19": "/videos/barber-client-experience.mp4",
    "barber-lesson-20": "/videos/course-barber-consultation.mp4",
    "barber-lesson-22": "/videos/course-barber-fade-narrated.mp4",
    "barber-lesson-23": "/videos/course-barber-fade-narrated.mp4",
    "barber-lesson-24": "/videos/course-barber-clipper-techniques.mp4",
    "barber-lesson-25": "/videos/course-barber-scissors.mp4",
    "barber-lesson-26": "/videos/course-barber-lineup-narrated.mp4",
    "barber-lesson-27": "/videos/course-barber-scissors-narrated.mp4",
    "barber-lesson-29": "/videos/course-barber-razor-narrated.mp4",
    "barber-lesson-30": "/videos/course-barber-razor-narrated.mp4",
    "barber-lesson-31": "/videos/course-barber-beard-narrated.mp4",
    "barber-lesson-32": "/videos/course-barber-beard-narrated.mp4",
    "barber-lesson-33": "/videos/course-barber-beard.mp4",
    "barber-lesson-35": "/videos/course-barber-styling-narrated.mp4",
    "barber-lesson-36": "/videos/course-barber-sanitation-narrated.mp4",
    "barber-lesson-37": "/videos/course-barber-styling-narrated.mp4",
    "barber-lesson-38": "/videos/course-barber-shampoo-narrated.mp4",
    "barber-lesson-40": "/videos/course-barber-consultation.mp4",
    "barber-lesson-41": "/videos/barber-shop-culture.mp4",
    "barber-lesson-42": "/videos/barber-shop-culture.mp4",
    "barber-lesson-43": "/videos/barber-client-experience.mp4",
    "barber-lesson-44": "/videos/course-barber-styling-narrated.mp4",
    "barber-lesson-46": "/videos/barber-course-intro-with-voice.mp4",
    "barber-lesson-47": "/videos/course-barber-sanitation-narrated.mp4",
    "barber-lesson-48": "/videos/course-barber-fade-narrated.mp4",
    "barber-lesson-49": "/videos/course-barber-scissors-narrated.mp4"
  }';

  rec record;
  video_file text;
BEGIN
  FOR rec IN
    SELECT id, slug, video_url, video_config
    FROM course_lessons
    WHERE course_id = barber_course_id
  LOOP
    video_file := mapping ->> rec.slug;
    CONTINUE WHEN video_file IS NULL;

    UPDATE course_lessons
    SET
      -- Only set video_url if not already populated
      video_url    = COALESCE(NULLIF(rec.video_url, ''), video_file),
      -- Always write videoFile into video_config for runtime fallback
      video_config = COALESCE(rec.video_config, '{}'::jsonb) || jsonb_build_object('videoFile', video_file),
      updated_at   = now()
    WHERE id = rec.id;
  END LOOP;
END $$;
