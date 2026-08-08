-- Realtime + deterministic learner onboarding for the canonical community.

-- Add relevant tables to Supabase Realtime. Duplicate membership raises an
-- error, so guard with pg_publication_tables checks.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'notifications',
    'community_notifications',
    'messages',
    'community_posts',
    'community_post_comments',
    'community_post_likes'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.community_visibility_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.community_visible = true AND COALESCE(OLD.community_visible, false) = false THEN
    INSERT INTO public.community_notifications(
      user_id, actor_id, type, source_id, title, message, href
    ) VALUES (
      NEW.id,
      NULL,
      'system',
      'community-welcome-' || NEW.id::text,
      'Welcome to Elevate Community',
      'Your community profile is now visible. Join a study group, introduce yourself, explore events and career opportunities, or open the AI Team for help.',
      '/lms/community'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_visibility_welcome_trigger ON public.profiles;
CREATE TRIGGER community_visibility_welcome_trigger
  AFTER UPDATE OF community_visible ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.community_visibility_welcome();

-- Messages should not be forgeable by privileged browser clients. Service-role
-- server operations bypass RLS and do not need an admin INSERT/UPDATE bypass.
DROP POLICY IF EXISTS admin_bypass_insert ON public.messages;
DROP POLICY IF EXISTS admin_bypass_update ON public.messages;
