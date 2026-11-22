-- Replay of isolated QA stages 20261119130111, 20261119222754, 20261119222903 and 20261119222921.
BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $qa$
BEGIN
  IF to_regclass('private.qa_environment_identity') IS NULL THEN
    RAISE EXCEPTION 'Host Shop schema stage requires the isolated QA identity';
  END IF;
  IF (SELECT array_agg(project_ref) FROM private.qa_environment_identity)
       IS DISTINCT FROM ARRAY['isdgjcdabhxxozarmxta']::text[] THEN
    RAISE EXCEPTION 'Host Shop schema stage refused outside isolated QA';
  END IF;
END;
$qa$;

-- Isolated elevate-lms-qa schema stage. Source: baseline 20260227000003,
-- canonical partner link 20260809223000, and address review 20260930220000.
CREATE TABLE IF NOT EXISTS public.shops (
  id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ein TEXT,
  address1 TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT NOT NULL DEFAULT 'IN',
  zip TEXT,
  phone TEXT,
  email TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  latitude NUMERIC,
  longitude NUMERIC,
  geocoded_at TIMESTAMPTZ,
  geocode_source VARCHAR,
  geocode_failed_at TIMESTAMPTZ,
  geocode_error TEXT,
  owner_id UUID,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  address_review_status TEXT CHECK (address_review_status IN ('confirmed', 'correction_requested')),
  address_review_note TEXT,
  address_reviewed_at TIMESTAMPTZ,
  address_reviewed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_shops_partner_id ON public.shops(partner_id);
CREATE INDEX IF NOT EXISTS idx_shops_tenant ON public.shops(tenant_id);

CREATE TABLE IF NOT EXISTS public.shop_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'manager',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  UNIQUE (shop_id, user_id)
);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_staff ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.shops, public.shop_staff FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.shops, public.shop_staff TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shops, public.shop_staff TO service_role;

DROP POLICY IF EXISTS shop_staff_own_read ON public.shop_staff;
CREATE POLICY shop_staff_own_read ON public.shop_staff FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) AND tenant_id = (SELECT rpc_private.get_current_tenant_id()));

DROP POLICY IF EXISTS shops_partner_read ON public.shops;
CREATE POLICY shops_partner_read ON public.shops FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT rpc_private.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM public.shop_staff AS staff
      WHERE staff.shop_id = shops.id AND staff.user_id = (SELECT auth.uid()) AND staff.active
    )
  );

DROP POLICY IF EXISTS shops_admin_all ON public.shops;
CREATE POLICY shops_admin_all ON public.shops FOR ALL TO authenticated
  USING (
    (SELECT rpc_private.is_admin()) AND
    ((SELECT rpc_private.is_super_admin()) OR tenant_id = (SELECT rpc_private.get_current_tenant_id()))
  );

DROP POLICY IF EXISTS require_privileged_aal2 ON public.shops;
CREATE POLICY require_privileged_aal2 ON public.shops AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK ((SELECT security_private.privileged_session_mfa_satisfied()));

DROP POLICY IF EXISTS require_privileged_aal2 ON public.shop_staff;
CREATE POLICY require_privileged_aal2 ON public.shop_staff AS RESTRICTIVE FOR ALL TO authenticated
  USING ((SELECT security_private.privileged_session_mfa_satisfied()))
  WITH CHECK ((SELECT security_private.privileged_session_mfa_satisfied()));


-- QA's legacy current-tenant helper returns partner_id for this identity.
-- Match Host Shop reads on the actual staff and approved partner links.
DROP POLICY IF EXISTS shop_staff_own_read ON public.shop_staff;
CREATE POLICY shop_staff_own_read ON public.shop_staff FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS shops_partner_read ON public.shops;
CREATE POLICY shops_partner_read ON public.shops FOR SELECT TO authenticated
  USING (
    active
    AND EXISTS (
      SELECT 1 FROM public.shop_staff AS staff
      WHERE staff.shop_id = shops.id AND staff.tenant_id = shops.tenant_id
        AND staff.user_id = (SELECT auth.uid()) AND staff.active
    )
    AND EXISTS (
      SELECT 1 FROM public.partner_users AS membership
      JOIN public.partners AS partner ON partner.id = membership.partner_id
      WHERE membership.partner_id = shops.partner_id
        AND membership.user_id = (SELECT auth.uid())
        AND membership.status = 'active'
        AND membership.role IN ('owner', 'partner_admin', 'admin', 'supervisor', 'mentor', 'manager')
        AND partner.status = 'active' AND partner.approval_status = 'approved'
        AND partner.is_active IS DISTINCT FROM false
    )
  );


-- The approved-partner check must not require exposing partner records.
CREATE OR REPLACE FUNCTION rpc_private.qa_has_approved_shop_membership(target_partner uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partner_users AS membership
    JOIN public.partners AS partner ON partner.id = membership.partner_id
    WHERE membership.partner_id = target_partner
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'
      AND membership.role IN ('owner', 'partner_admin', 'admin', 'supervisor', 'mentor', 'manager')
      AND partner.status = 'active' AND partner.approval_status = 'approved'
      AND partner.is_active IS DISTINCT FROM false
  );
$$;
REVOKE ALL ON FUNCTION rpc_private.qa_has_approved_shop_membership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rpc_private.qa_has_approved_shop_membership(uuid) TO authenticated;

ALTER POLICY shops_partner_read ON public.shops
  USING (
    active
    AND EXISTS (
      SELECT 1 FROM public.shop_staff AS staff
      WHERE staff.shop_id = shops.id AND staff.tenant_id = shops.tenant_id
        AND staff.user_id = (SELECT auth.uid()) AND staff.active
    )
    AND rpc_private.qa_has_approved_shop_membership(partner_id)
  );


-- QA-ONLY audit sink structural stage. No production audit rows or triggers copied.
CREATE TABLE public."audit_failures" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "context" text,
  "error_message" text,
  "original_event" jsonb,
  "resolved" boolean DEFAULT false,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid
);
ALTER TABLE public."audit_failures" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."audit_failures" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public."audit_failures" TO service_role;
CREATE TABLE public."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "actor_id" uuid,
  "target_type" text,
  "target_id" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "ip_address" inet,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "actor_role" text,
  "entity" text,
  "resource_type" text,
  "resource_id" text,
  "user_id" uuid,
  "details" jsonb,
  "event_type" text,
  "before_state" jsonb,
  "after_state" jsonb,
  "actor_email" text,
  "program_id" uuid,
  "student_id" uuid,
  "entity_id" text,
  "entity_type" text,
  "changes" jsonb,
  "actor_user_id" uuid,
  "meta" jsonb,
  "subject" text,
  "who" text,
  "notes" text,
  "status" text,
  "reason" text,
  "creator_email" text,
  "email_sent" boolean,
  "timestamp" timestamp with time zone,
  "count" integer,
  "steps_generated" integer,
  "title" text,
  "type" text,
  "agreements_signed" boolean,
  "total_courses" integer,
  "successful" integer,
  "failed" integer,
  "forced" boolean,
  "program_title" text,
  "eligible" boolean,
  "funding_types" text,
  "state" text,
  "stage" text,
  "career_interest" text,
  "source" text,
  "week_ending" text,
  "hours_worked" numeric,
  "hours" numeric,
  "credential_type" text,
  "viewer_role" text,
  "ip" text,
  "email" text,
  "results_count" integer,
  "share_link_id" text,
  "tenant_id" uuid,
  "role" text,
  "success" boolean DEFAULT true,
  "action_type" text,
  "description" text,
  "old_data" jsonb,
  "new_data" jsonb,
  "actor_type" text
);
ALTER TABLE public."audit_logs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."audit_logs" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public."audit_logs" TO service_role;
ALTER TABLE public."audit_failures" ADD CONSTRAINT "audit_failures_pkey" PRIMARY KEY (id);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);
CREATE INDEX idx_audit_failures_unresolved ON public.audit_failures USING btree (created_at DESC) WHERE (resolved = false);
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);
CREATE INDEX idx_audit_logs_action_ts ON public.audit_logs USING btree (action, created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs USING btree (action_type, created_at DESC) WHERE (action_type IS NOT NULL);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs USING btree (actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs USING btree (target_type, target_id);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

-- Fresh QA catalogs need the tenant anchor used by the fixture provisioners.
INSERT INTO public.programs
  (slug, title, category, tenant_id, is_active, published, is_apprenticeship)
SELECT 'barber-apprenticeship', 'Barber Apprenticeship', 'beauty',
       tenant.id, true, true, true
FROM public.tenants AS tenant
WHERE tenant.slug = 'elevate-lms-qa'
ON CONFLICT (slug) DO NOTHING;

DO $qa$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.programs AS program
    JOIN public.tenants AS tenant ON tenant.id = program.tenant_id
    WHERE program.slug = 'barber-apprenticeship' AND tenant.slug = 'elevate-lms-qa'
  ) THEN
    RAISE EXCEPTION 'The Barber apprenticeship must belong to the isolated QA tenant';
  END IF;
END;
$qa$;

NOTIFY pgrst, 'reload schema';
COMMIT;
