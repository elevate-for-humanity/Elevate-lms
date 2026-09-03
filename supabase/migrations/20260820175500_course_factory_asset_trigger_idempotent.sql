-- Keep Course Factory experience materialization idempotent.
-- Activities are persisted by the canonical publisher; the trigger only mirrors
-- assets that the atomic RPC does not currently project into first-class columns.

CREATE OR REPLACE FUNCTION public.sync_course_lesson_experience_assets()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_experience jsonb;
BEGIN
  v_experience := coalesce(NEW.content_json->'experience', NEW.content->'experience');

  IF jsonb_typeof(v_experience) = 'object' THEN
    IF jsonb_typeof(v_experience->'resources') = 'array' THEN
      NEW.resources := v_experience->'resources';
    END IF;

    NEW.scene_data := jsonb_strip_nulls(
      coalesce(NEW.scene_data, '{}'::jsonb) ||
      jsonb_build_object(
        'visual_prompt', v_experience->>'visualPrompt',
        'scenario', v_experience->'scenario',
        'case_study', v_experience->'caseStudy',
        'quick_clips', v_experience->'quickClips',
        'reading_guide', v_experience->'readingGuide',
        'glossary', v_experience->'glossary',
        'readiness', v_experience->'readiness'
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;
