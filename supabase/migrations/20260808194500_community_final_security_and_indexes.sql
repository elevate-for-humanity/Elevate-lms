-- Final community privacy + query performance pass.

CREATE OR REPLACE FUNCTION public.can_read_community_post(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.community_posts p
    WHERE p.id = p_post_id
      AND (p.user_id = auth.uid() OR public.same_community_tenant(p.user_id) OR public.is_admin())
  );
$$;
REVOKE ALL ON FUNCTION public.can_read_community_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_community_post(uuid) TO authenticated;

-- Likes/comments are only readable when the underlying post is readable.
DROP POLICY IF EXISTS community_post_comments_read ON public.community_post_comments;
CREATE POLICY community_post_comments_read ON public.community_post_comments
  FOR SELECT TO authenticated
  USING (public.can_read_community_post(post_id));

DROP POLICY IF EXISTS community_post_likes_read ON public.community_post_likes;
CREATE POLICY community_post_likes_read ON public.community_post_likes
  FOR SELECT TO authenticated
  USING (public.can_read_community_post(post_id));

-- Core notifications are private to their recipient; admins retain explicit
-- admin_bypass policies. Remove tenant-wide visibility from the legacy policy.
DROP POLICY IF EXISTS notifications_select ON public.notifications;
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin());

-- Query indexes used by the canonical feed, directory graph, groups, messaging,
-- notifications, and moderation screens.
CREATE INDEX IF NOT EXISTS community_posts_created_desc_idx
  ON public.community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_user_created_desc_idx
  ON public.community_posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_follows_following_created_desc_idx
  ON public.community_follows (following_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_mentions_mentioned_created_desc_idx
  ON public.community_mentions (mentioned_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS study_groups_created_desc_idx
  ON public.study_groups (created_at DESC);
CREATE INDEX IF NOT EXISTS study_groups_created_by_idx
  ON public.study_groups (created_by);
CREATE INDEX IF NOT EXISTS messages_pair_created_desc_idx
  ON public.messages (sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_recipient_sender_created_desc_idx
  ON public.messages (recipient_id, sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS community_notifications_user_created_desc_idx
  ON public.community_notifications (user_id, created_at DESC);
