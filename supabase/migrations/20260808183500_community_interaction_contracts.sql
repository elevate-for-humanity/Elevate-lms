-- Final interaction contracts for the canonical learner community.

-- Community feed is authenticated product data, not anonymous marketing data.
DROP POLICY IF EXISTS "Public read" ON public.community_posts;
DROP POLICY IF EXISTS community_posts_authenticated_read ON public.community_posts;
CREATE POLICY community_posts_authenticated_read ON public.community_posts
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth insert" ON public.community_posts;
CREATE POLICY community_posts_insert_own ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own update" ON public.community_posts;
CREATE POLICY community_posts_update_own ON public.community_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS community_posts_delete_own ON public.community_posts;
CREATE POLICY community_posts_delete_own ON public.community_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;

-- Study groups are authenticated and membership is reversible.
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS member_count integer NOT NULL DEFAULT 0;
DROP POLICY IF EXISTS "Public read" ON public.study_groups;
DROP POLICY IF EXISTS study_groups_authenticated_read ON public.study_groups;
CREATE POLICY study_groups_authenticated_read ON public.study_groups
  FOR SELECT TO authenticated USING (is_active = true OR created_by = auth.uid());
DROP POLICY IF EXISTS "Auth insert" ON public.study_groups;
CREATE POLICY study_groups_insert_authenticated ON public.study_groups
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
DROP POLICY IF EXISTS study_groups_update_owner ON public.study_groups;
CREATE POLICY study_groups_update_owner ON public.study_groups
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
GRANT SELECT, INSERT, UPDATE ON public.study_groups TO authenticated;

DROP POLICY IF EXISTS "Public read" ON public.study_group_members;
DROP POLICY IF EXISTS study_group_members_authenticated_read ON public.study_group_members;
CREATE POLICY study_group_members_authenticated_read ON public.study_group_members
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Auth join" ON public.study_group_members;
CREATE POLICY study_group_members_insert_own ON public.study_group_members
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS study_group_members_delete_own ON public.study_group_members;
CREATE POLICY study_group_members_delete_own ON public.study_group_members
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.study_group_members TO authenticated;

CREATE OR REPLACE FUNCTION public.refresh_study_group_member_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target uuid;
BEGIN
  target := COALESCE(NEW.study_group_id, OLD.study_group_id);
  UPDATE public.study_groups g
  SET member_count = (SELECT count(*)::integer FROM public.study_group_members m WHERE m.study_group_id = target)
  WHERE g.id = target;
  RETURN COALESCE(NEW, OLD);
END; $$;
DROP TRIGGER IF EXISTS study_group_member_count_refresh ON public.study_group_members;
CREATE TRIGGER study_group_member_count_refresh
  AFTER INSERT OR DELETE ON public.study_group_members
  FOR EACH ROW EXECUTE FUNCTION public.refresh_study_group_member_count();
UPDATE public.study_groups g
SET member_count = (SELECT count(*)::integer FROM public.study_group_members m WHERE m.study_group_id = g.id);

-- Forum permissions/grants and idempotency.
CREATE UNIQUE INDEX IF NOT EXISTS forum_upvotes_user_reply_unique
  ON public.forum_upvotes(user_id, reply_id)
  WHERE user_id IS NOT NULL AND reply_id IS NOT NULL;
GRANT SELECT ON public.forum_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_topics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_replies TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.forum_upvotes TO authenticated;

-- Forum reply notifications feed the same learner notification center.
CREATE OR REPLACE FUNCTION public.notify_forum_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
  SELECT author_id::uuid INTO owner_id FROM public.forum_topics WHERE id = NEW.topic_id;
  IF owner_id IS NOT NULL AND owner_id <> NEW.author_id::uuid THEN
    INSERT INTO public.community_notifications(user_id, actor_id, type, source_id, title, message, href)
    VALUES(owner_id, NEW.author_id::uuid, 'comment', NEW.id::text, 'New reply to your discussion', left(NEW.content, 180), '/lms/community');
  END IF;
  RETURN NEW;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS forum_reply_notification ON public.forum_replies;
CREATE TRIGGER forum_reply_notification AFTER INSERT ON public.forum_replies
  FOR EACH ROW EXECUTE FUNCTION public.notify_forum_reply();

-- Report/flag queue for learner moderation.
CREATE TABLE IF NOT EXISTS public.community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','comment','topic','reply','group','member')),
  target_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam','harassment','unsafe','privacy','misinformation','other')),
  details text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS community_reports_status_created_idx ON public.community_reports(status, created_at DESC);
ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_reports_insert_own ON public.community_reports;
CREATE POLICY community_reports_insert_own ON public.community_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS community_reports_select_own ON public.community_reports;
CREATE POLICY community_reports_select_own ON public.community_reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
GRANT SELECT, INSERT ON public.community_reports TO authenticated;

-- Private authenticated community media bucket.
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS media_path text;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS community_media_authenticated_read ON storage.objects;
CREATE POLICY community_media_authenticated_read ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'community-media');
DROP POLICY IF EXISTS community_media_insert_own ON storage.objects;
CREATE POLICY community_media_insert_own ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS community_media_update_own ON storage.objects;
CREATE POLICY community_media_update_own ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS community_media_delete_own ON storage.objects;
CREATE POLICY community_media_delete_own ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'community-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
