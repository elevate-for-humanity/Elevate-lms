-- Safe community directory + messaging policies.
-- Never grant broad cross-user SELECT on public.profiles: that table contains
-- student/workforce fields that do not belong in the social directory.

-- ---------------------------------------------------------------------------
-- Safe, tenant-scoped community member directory RPCs.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_community_members(p_search text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  role text,
  community_show_role boolean,
  community_allow_messages boolean,
  community_allow_follow boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caller AS (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    CASE WHEN p.community_show_role THEN p.role::text ELSE NULL END AS role,
    p.community_show_role,
    p.community_allow_messages,
    p.community_allow_follow
  FROM public.profiles p
  CROSS JOIN caller c
  WHERE auth.uid() IS NOT NULL
    AND p.community_visible = true
    AND p.full_name IS NOT NULL
    AND p.tenant_id IS NOT DISTINCT FROM c.tenant_id
    AND (
      NULLIF(btrim(COALESCE(p_search, '')), '') IS NULL
      OR p.full_name ILIKE '%' || replace(replace(btrim(p_search), '%', ''), '_', '') || '%'
    )
  ORDER BY p.full_name ASC
  LIMIT 250;
$$;

CREATE OR REPLACE FUNCTION public.get_community_member(p_member_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  role text,
  community_visible boolean,
  community_show_role boolean,
  community_allow_messages boolean,
  community_allow_follow boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caller AS (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    CASE WHEN p.community_show_role THEN p.role::text ELSE NULL END AS role,
    p.community_visible,
    p.community_show_role,
    p.community_allow_messages,
    p.community_allow_follow
  FROM public.profiles p
  CROSS JOIN caller c
  WHERE auth.uid() IS NOT NULL
    AND p.id = p_member_id
    AND p.tenant_id IS NOT DISTINCT FROM c.tenant_id
    AND (p.community_visible = true OR p.id = auth.uid())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_community_members(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_community_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_community_members(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_member(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Security-definer predicates used by RLS. They expose booleans, not profile rows.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_follow_community_member(p_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caller AS (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles target
    CROSS JOIN caller c
    WHERE target.id = p_target
      AND target.id <> auth.uid()
      AND target.community_visible = true
      AND target.community_allow_follow = true
      AND target.tenant_id IS NOT DISTINCT FROM c.tenant_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_start_community_message(p_sender uuid, p_recipient uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_tenant uuid;
  sender_role text;
  recipient_tenant uuid;
  recipient_role text;
  recipient_visible boolean;
  recipient_allows boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_sender OR p_sender = p_recipient THEN
    RETURN false;
  END IF;

  SELECT tenant_id, role::text INTO sender_tenant, sender_role
  FROM public.profiles WHERE id = p_sender;
  SELECT tenant_id, role::text, community_visible, community_allow_messages
  INTO recipient_tenant, recipient_role, recipient_visible, recipient_allows
  FROM public.profiles WHERE id = p_recipient;

  IF recipient_tenant IS DISTINCT FROM sender_tenant THEN RETURN false; END IF;

  -- Never break an existing legitimate conversation.
  IF EXISTS (
    SELECT 1 FROM public.messages m
    WHERE (m.sender_id = p_sender AND m.recipient_id = p_recipient)
       OR (m.sender_id = p_recipient AND m.recipient_id = p_sender)
  ) THEN RETURN true; END IF;

  -- Staff/instructors may initiate service/course communications inside tenant.
  IF sender_role IN ('admin','super_admin','staff','instructor')
     OR recipient_role IN ('admin','super_admin','staff','instructor') THEN
    RETURN true;
  END IF;

  RETURN COALESCE(recipient_visible, false) AND COALESCE(recipient_allows, false);
END;
$$;

REVOKE ALL ON FUNCTION public.can_follow_community_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_start_community_message(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_follow_community_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_start_community_message(uuid,uuid) TO authenticated;

-- Follow RLS must use the safe predicate because learners cannot SELECT the
-- target's underlying profile row.
DROP POLICY IF EXISTS community_follows_insert_own ON public.community_follows;
CREATE POLICY community_follows_insert_own ON public.community_follows
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = follower_id
    AND public.can_follow_community_member(following_id)
  );

-- Harden message creation at the database boundary, not only in the UI.
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.can_start_community_message(sender_id, recipient_id)
  );

-- Read receipts are changed through a narrow RPC so recipients cannot edit
-- another sender's content/sender/recipient columns via a generic UPDATE.
CREATE OR REPLACE FUNCTION public.mark_community_messages_read(p_other_user uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE changed integer;
BEGIN
  IF auth.uid() IS NULL THEN RETURN 0; END IF;
  UPDATE public.messages
  SET read_at = COALESCE(read_at, now())
  WHERE sender_id = p_other_user
    AND recipient_id = auth.uid()
    AND read_at IS NULL;
  GET DIAGNOSTICS changed = ROW_COUNT;
  RETURN changed;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_community_messages_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_community_messages_read(uuid) TO authenticated;
