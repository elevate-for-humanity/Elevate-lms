-- Remove remaining permissive notification policy and tenant-scope private media.

-- A historical policy allowed every authenticated account to SELECT every
-- notification. Canonical policies below keep rows limited to owner/tenant/admin.
DROP POLICY IF EXISTS auth_read_notifications ON public.notifications;

-- Safe folder-owner predicate for private community media. Object names created
-- by the app begin with the uploader UUID; malformed legacy names simply fail.
CREATE OR REPLACE FUNCTION public.can_read_community_media(p_folder text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
BEGIN
  IF auth.uid() IS NULL OR p_folder IS NULL THEN RETURN false; END IF;
  BEGIN
    owner_id := p_folder::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN false;
  END;
  RETURN owner_id = auth.uid() OR public.same_community_tenant(owner_id) OR public.is_admin();
END;
$$;
REVOKE ALL ON FUNCTION public.can_read_community_media(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_community_media(text) TO authenticated;

DROP POLICY IF EXISTS community_media_authenticated_read ON storage.objects;
CREATE POLICY community_media_authenticated_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'community-media'
    AND public.can_read_community_media((storage.foldername(name))[1])
  );
