-- Production hardening for the learner community.
-- Additive/idempotent and safe for existing accounts.

-- ---------------------------------------------------------------------------
-- Explicit community privacy controls on profiles.
-- Existing profiles remain private until the learner opts in.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS community_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS community_allow_messages boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS community_allow_follow boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS community_show_role boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS profiles_community_visible_name_idx
  ON public.profiles (community_visible, full_name)
  WHERE community_visible = true;

-- ---------------------------------------------------------------------------
-- Follow/connect graph.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT community_follows_not_self CHECK (follower_id <> following_id)
);

ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_follows_read ON public.community_follows;
CREATE POLICY community_follows_read ON public.community_follows
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS community_follows_insert_own ON public.community_follows;
CREATE POLICY community_follows_insert_own ON public.community_follows
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = following_id
        AND p.community_visible = true
        AND p.community_allow_follow = true
    )
  );
DROP POLICY IF EXISTS community_follows_delete_own ON public.community_follows;
CREATE POLICY community_follows_delete_own ON public.community_follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);
GRANT SELECT, INSERT, DELETE ON public.community_follows TO authenticated;

-- ---------------------------------------------------------------------------
-- Community notifications: in-app, read/unread, source-aware.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('like','comment','follow','mention','group','event','system')),
  source_id text,
  title text NOT NULL,
  message text,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS community_notifications_user_unread_idx
  ON public.community_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_notifications_select_own ON public.community_notifications;
CREATE POLICY community_notifications_select_own ON public.community_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS community_notifications_update_own ON public.community_notifications;
CREATE POLICY community_notifications_update_own ON public.community_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, UPDATE ON public.community_notifications TO authenticated;

-- ---------------------------------------------------------------------------
-- Optional post media and mention metadata. No public bucket is created here;
-- URLs must come from the existing authenticated upload flow/storage policy.
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_type text,
  ADD COLUMN IF NOT EXISTS media_alt text;

ALTER TABLE public.community_posts DROP CONSTRAINT IF EXISTS community_posts_media_type_check;
ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_media_type_check
  CHECK (media_type IS NULL OR media_type IN ('image','video','file'));

CREATE TABLE IF NOT EXISTS public.community_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_mentions_source CHECK ((post_id IS NOT NULL) <> (comment_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS community_mentions_post_user_unique
  ON public.community_mentions (post_id, mentioned_user_id) WHERE post_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS community_mentions_comment_user_unique
  ON public.community_mentions (comment_id, mentioned_user_id) WHERE comment_id IS NOT NULL;
ALTER TABLE public.community_mentions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_mentions_read ON public.community_mentions;
CREATE POLICY community_mentions_read ON public.community_mentions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS community_mentions_insert_own ON public.community_mentions;
CREATE POLICY community_mentions_insert_own ON public.community_mentions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
GRANT SELECT, INSERT ON public.community_mentions TO authenticated;

-- ---------------------------------------------------------------------------
-- Notification triggers. SECURITY DEFINER keeps clients from inserting arbitrary
-- notifications while still allowing social actions to create them.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_community_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.community_posts WHERE id = NEW.post_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.community_notifications(user_id, actor_id, type, source_id, title, message, href)
    VALUES(owner_id, NEW.user_id, 'like', NEW.post_id::text, 'Someone liked your post', 'Your community post received a like.', '/lms/community');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS community_like_notification ON public.community_post_likes;
CREATE TRIGGER community_like_notification AFTER INSERT ON public.community_post_likes
  FOR EACH ROW EXECUTE FUNCTION public.notify_community_like();

CREATE OR REPLACE FUNCTION public.notify_community_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM public.community_posts WHERE id = NEW.post_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.user_id THEN
    INSERT INTO public.community_notifications(user_id, actor_id, type, source_id, title, message, href)
    VALUES(owner_id, NEW.user_id, 'comment', NEW.id::text, 'New comment on your post', left(NEW.content, 180), '/lms/community');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS community_comment_notification ON public.community_post_comments;
CREATE TRIGGER community_comment_notification AFTER INSERT ON public.community_post_comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_community_comment();

CREATE OR REPLACE FUNCTION public.notify_community_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.community_notifications(user_id, actor_id, type, source_id, title, message, href)
  VALUES(NEW.following_id, NEW.follower_id, 'follow', NEW.follower_id::text, 'New community connection', 'A community member followed you.', '/lms/members/' || NEW.follower_id::text);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS community_follow_notification ON public.community_follows;
CREATE TRIGGER community_follow_notification AFTER INSERT ON public.community_follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_community_follow();

CREATE OR REPLACE FUNCTION public.notify_community_mention()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.mentioned_user_id <> NEW.created_by THEN
    INSERT INTO public.community_notifications(user_id, actor_id, type, source_id, title, message, href)
    VALUES(NEW.mentioned_user_id, NEW.created_by, 'mention', NEW.id::text, 'You were mentioned', 'A community member mentioned you.', '/lms/community');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS community_mention_notification ON public.community_mentions;
CREATE TRIGGER community_mention_notification AFTER INSERT ON public.community_mentions
  FOR EACH ROW EXECUTE FUNCTION public.notify_community_mention();
