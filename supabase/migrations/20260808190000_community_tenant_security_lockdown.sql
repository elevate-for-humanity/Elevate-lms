-- Community tenant isolation + legacy RLS bypass removal.
-- This migration is required because Postgres permissive policies combine with OR:
-- a legacy broad policy can silently defeat a newer restrictive-looking policy.

CREATE OR REPLACE FUNCTION public.same_community_tenant(p_other_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.profiles me
    JOIN public.profiles other_user
      ON other_user.id = p_other_user
     AND other_user.tenant_id IS NOT DISTINCT FROM me.tenant_id
    WHERE me.id = auth.uid()
  );
$$;
REVOKE ALL ON FUNCTION public.same_community_tenant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.same_community_tenant(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Messages: remove legacy policies that widened SELECT/INSERT for everyone.
-- Keep the canonical own-message SELECT and hardened INSERT policy.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS auth_read_messages ON public.messages;
DROP POLICY IF EXISTS users_send ON public.messages;
DROP POLICY IF EXISTS users_own ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.can_start_community_message(sender_id, recipient_id)
  );

-- ---------------------------------------------------------------------------
-- Feed: only users in the same tenant can read another learner's post.
-- Own/admin mutation policies remain separate.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS community_posts_authenticated_read ON public.community_posts;
CREATE POLICY community_posts_authenticated_read ON public.community_posts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.same_community_tenant(user_id));

-- Follows are private to the two participants. This also prevents cross-tenant
-- social graph enumeration.
DROP POLICY IF EXISTS community_follows_read ON public.community_follows;
CREATE POLICY community_follows_read ON public.community_follows
  FOR SELECT TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Group memberships are needed by the current learner and admin, not by every
-- authenticated user. Public member totals are maintained on study_groups.
DROP POLICY IF EXISTS study_group_members_authenticated_read ON public.study_group_members;
CREATE POLICY study_group_members_authenticated_read ON public.study_group_members
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Groups are tenant-scoped through their creator. Legacy null creators are
-- intentionally not exposed cross-tenant.
DROP POLICY IF EXISTS study_groups_authenticated_read ON public.study_groups;
CREATE POLICY study_groups_authenticated_read ON public.study_groups
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.same_community_tenant(created_by));

-- ---------------------------------------------------------------------------
-- Forums: replace historical USING(true) policies with tenant-aware policies.
-- Categories remain global taxonomy; topics/replies/upvotes are tenant-scoped.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Forum topics viewable by authenticated users" ON public.forum_topics;
CREATE POLICY "Forum topics viewable by authenticated users" ON public.forum_topics
  FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.same_community_tenant(author_id::uuid));

DROP POLICY IF EXISTS "Forum replies viewable by authenticated users" ON public.forum_replies;
CREATE POLICY "Forum replies viewable by authenticated users" ON public.forum_replies
  FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.same_community_tenant(author_id::uuid));

DROP POLICY IF EXISTS "Forum upvotes viewable by authenticated users" ON public.forum_upvotes;
CREATE POLICY "Forum upvotes viewable by authenticated users" ON public.forum_upvotes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.same_community_tenant(user_id));

-- Community mentions should only be visible to the actor or mentioned learner.
DROP POLICY IF EXISTS community_mentions_read ON public.community_mentions;
CREATE POLICY community_mentions_read ON public.community_mentions
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by OR auth.uid() = mentioned_user_id);

-- Reports stay visible only to their reporter through learner RLS. Admin uses
-- service/admin server access and the Admin route's operator guard.
