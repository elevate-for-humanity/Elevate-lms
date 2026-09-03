-- Materialize Course Factory experience assets into first-class lesson columns.
-- content_json.experience remains the canonical portable contract; these columns
-- exist for LMS queries/reporting and must never silently drift to NULL.

CREATE OR REPLACE FUNCTION public.sync_course_lesson_experience_assets()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_experience jsonb;
  v_exercises jsonb;
  v_practical jsonb;
BEGIN
  v_experience := coalesce(NEW.content_json->'experience', NEW.content->'experience');

  IF jsonb_typeof(v_experience) = 'object' THEN
    IF jsonb_typeof(v_experience->'resources') = 'array' THEN
      NEW.resources := v_experience->'resources';
    END IF;

    v_exercises := CASE
      WHEN jsonb_typeof(v_experience->'exercises') = 'array'
      THEN (
        SELECT coalesce(jsonb_agg(jsonb_build_object('type', 'exercise') || item), '[]'::jsonb)
        FROM jsonb_array_elements(v_experience->'exercises') AS item
      )
      ELSE '[]'::jsonb
    END;

    v_practical := CASE
      WHEN jsonb_typeof(v_experience->'practicalTask') = 'object'
      THEN jsonb_build_array(jsonb_build_object('type', 'practical') || (v_experience->'practicalTask'))
      ELSE '[]'::jsonb
    END;

    IF jsonb_array_length(v_exercises) > 0 OR jsonb_array_length(v_practical) > 0 THEN
      NEW.activities := coalesce(NEW.activities, '[]'::jsonb) || v_exercises || v_practical;
    END IF;

    IF NEW.scene_data IS NULL THEN
      NEW.scene_data := jsonb_strip_nulls(jsonb_build_object(
        'visual_prompt', v_experience->>'visualPrompt',
        'scenario', v_experience->'scenario',
        'case_study', v_experience->'caseStudy',
        'quick_clips', v_experience->'quickClips',
        'reading_guide', v_experience->'readingGuide',
        'glossary', v_experience->'glossary',
        'readiness', v_experience->'readiness'
      ));
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_course_lesson_experience_assets ON public.course_lessons;
CREATE TRIGGER trg_sync_course_lesson_experience_assets
BEFORE INSERT OR UPDATE OF content, content_json
ON public.course_lessons
FOR EACH ROW
EXECUTE FUNCTION public.sync_course_lesson_experience_assets();

-- Backfill existing Course Factory lessons without changing authored content.
UPDATE public.course_lessons
SET content_json = content_json
WHERE jsonb_typeof(coalesce(content_json->'experience', content->'experience')) = 'object';
