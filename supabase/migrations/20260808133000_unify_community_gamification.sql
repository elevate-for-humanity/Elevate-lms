-- Unify learner community + gamification on the existing production tables.
-- Additive/idempotent: preserves legacy badges and existing community/forum data.

-- ---------------------------------------------------------------------------
-- Gamification: support both global and course-scoped scores.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leaderboard_scores
  ALTER COLUMN course_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_scores_user_global_unique
  ON public.leaderboard_scores (user_id)
  WHERE course_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_scores_user_course_unique
  ON public.leaderboard_scores (user_id, course_id)
  WHERE course_id IS NOT NULL;

-- badge_definitions is the canonical badge table because user_badges.badge_id
-- already references it. Keep public.badges as a legacy/read-compatible source.
ALTER TABLE public.badge_definitions
  ADD COLUMN IF NOT EXISTS key text;

CREATE UNIQUE INDEX IF NOT EXISTS badge_definitions_key_unique
  ON public.badge_definitions (key);

INSERT INTO public.badge_definitions (
  id, key, name, description, icon_url, badge_type, criteria,
  points_reward, rarity, is_active, created_at
)
SELECT
  b.id,
  trim(both '_' from regexp_replace(lower(b.name), '[^a-z0-9]+', '_', 'g')) AS key,
  b.name,
  b.description,
  b.icon_url,
  CASE
    WHEN b.criteria->>'type' = 'attendance' THEN 'streak'
    WHEN b.criteria->>'type' IN ('quiz_score', 'certification') THEN 'mastery'
    WHEN b.criteria->>'type' IN ('forum_replies', 'login') THEN 'social'
    WHEN b.criteria->>'type' IN ('course_start', 'lesson_complete', 'program_progress', 'program_complete') THEN 'completion'
    ELSE 'special'
  END AS badge_type,
  b.criteria,
  COALESCE(b.points, 0),
  CASE WHEN b.rarity IN ('common', 'rare', 'epic', 'legendary') THEN b.rarity ELSE 'rare' END,
  true,
  COALESCE(b.created_at, now())
FROM public.badges b
ON CONFLICT (id) DO UPDATE SET
  key = COALESCE(public.badge_definitions.key, EXCLUDED.key),
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url = COALESCE(EXCLUDED.icon_url, public.badge_definitions.icon_url),
  badge_type = COALESCE(public.badge_definitions.badge_type, EXCLUDED.badge_type),
  criteria = EXCLUDED.criteria,
  points_reward = EXCLUDED.points_reward,
  rarity = EXCLUDED.rarity,
  is_active = true;

INSERT INTO public.badge_definitions
  (key, name, description, badge_type, criteria, points_reward, rarity, is_active)
VALUES
  ('onboarding_complete', 'Welcome Aboard', 'Completed the learner platform orientation.', 'completion', '{"type":"onboarding_complete"}'::jsonb, 50, 'common', true),
  ('instructor_onboarded', 'Instructor Ready', 'Completed instructor platform onboarding.', 'completion', '{"type":"instructor_onboarded"}'::jsonb, 75, 'common', true)
ON CONFLICT (key) DO NOTHING;

-- Idempotent point-event ledger. The table predates this migration in some
-- environments, so reconcile missing columns instead of replacing it.
CREATE TABLE IF NOT EXISTS public.gamification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  points integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.gamification_events
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS course_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS gamification_events_idempotency_unique
  ON public.gamification_events (user_id, event_type, source_id)
  WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS gamification_events_user_created_idx
  ON public.gamification_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS gamification_events_course_idx
  ON public.gamification_events (course_id)
  WHERE course_id IS NOT NULL;

ALTER TABLE public.gamification_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS gamification_events_select_own ON public.gamification_events;
CREATE POLICY gamification_events_select_own
  ON public.gamification_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT ON public.gamification_events TO authenticated;

CREATE OR REPLACE FUNCTION public.award_gamification_points(
  p_user_id uuid,
  p_event_type text,
  p_source_id text,
  p_course_id uuid,
  p_points integer,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count integer;
BEGIN
  IF p_user_id IS NULL OR p_event_type IS NULL OR p_points = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO public.gamification_events
    (user_id, event_type, source_id, course_id, points, metadata)
  VALUES
    (p_user_id, p_event_type, p_source_id, p_course_id, p_points, COALESCE(p_metadata, '{}'::jsonb))
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RETURN false;
  END IF;

  IF p_course_id IS NULL THEN
    INSERT INTO public.leaderboard_scores (user_id, course_id, points, updated_at)
    VALUES (p_user_id, NULL, p_points, now())
    ON CONFLICT (user_id) WHERE course_id IS NULL
    DO UPDATE SET
      points = public.leaderboard_scores.points + EXCLUDED.points,
      updated_at = now();
  ELSE
    INSERT INTO public.leaderboard_scores (user_id, course_id, points, updated_at)
    VALUES (p_user_id, p_course_id, p_points, now())
    ON CONFLICT (user_id, course_id) WHERE course_id IS NOT NULL
    DO UPDATE SET
      points = public.leaderboard_scores.points + EXCLUDED.points,
      updated_at = now();
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.award_gamification_points(uuid,text,text,uuid,integer,jsonb) TO service_role;

-- ---------------------------------------------------------------------------
-- Community interactions: real likes and comments with count maintenance.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_post_comments_post_created_idx
  ON public.community_post_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS community_post_likes_post_idx
  ON public.community_post_likes (post_id);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_post_likes_read ON public.community_post_likes;
CREATE POLICY community_post_likes_read
  ON public.community_post_likes FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS community_post_likes_insert_own ON public.community_post_likes;
CREATE POLICY community_post_likes_insert_own
  ON public.community_post_likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS community_post_likes_delete_own ON public.community_post_likes;
CREATE POLICY community_post_likes_delete_own
  ON public.community_post_likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS community_post_comments_read ON public.community_post_comments;
CREATE POLICY community_post_comments_read
  ON public.community_post_comments FOR SELECT TO authenticated
  USING (true);
DROP POLICY IF EXISTS community_post_comments_insert_own ON public.community_post_comments;
CREATE POLICY community_post_comments_insert_own
  ON public.community_post_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS community_post_comments_update_own ON public.community_post_comments;
CREATE POLICY community_post_comments_update_own
  ON public.community_post_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS community_post_comments_delete_own ON public.community_post_comments;
CREATE POLICY community_post_comments_delete_own
  ON public.community_post_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, DELETE ON public.community_post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_post_comments TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_community_post_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_post uuid;
BEGIN
  target_post := COALESCE(NEW.post_id, OLD.post_id);

  UPDATE public.community_posts p
  SET
    likes_count = (SELECT count(*)::integer FROM public.community_post_likes l WHERE l.post_id = target_post),
    comments_count = (SELECT count(*)::integer FROM public.community_post_comments c WHERE c.post_id = target_post),
    updated_at = now()
  WHERE p.id = target_post;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS community_post_likes_refresh_counts ON public.community_post_likes;
CREATE TRIGGER community_post_likes_refresh_counts
  AFTER INSERT OR DELETE ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.refresh_community_post_counts();

DROP TRIGGER IF EXISTS community_post_comments_refresh_counts ON public.community_post_comments;
CREATE TRIGGER community_post_comments_refresh_counts
  AFTER INSERT OR DELETE ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.refresh_community_post_counts();

-- Repair cached counts if this migration is re-run after interactions exist.
UPDATE public.community_posts p
SET
  likes_count = (SELECT count(*)::integer FROM public.community_post_likes l WHERE l.post_id = p.id),
  comments_count = (SELECT count(*)::integer FROM public.community_post_comments c WHERE c.post_id = p.id);

-- Study group membership must be idempotent for a one-click Join action.
CREATE UNIQUE INDEX IF NOT EXISTS study_group_members_group_user_unique
  ON public.study_group_members (study_group_id, user_id)
  WHERE study_group_id IS NOT NULL AND user_id IS NOT NULL;
