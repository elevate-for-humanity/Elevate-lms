-- SaaS add-on subscriptions per organization (tenant).
-- Base plans update licenses.features via platform checkout fulfillment.

CREATE TABLE IF NOT EXISTS public.organization_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  addon_slug text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  stripe_subscription_item_id text,
  activated_at timestamptz NOT NULL DEFAULT now(),
  canceled_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, addon_slug)
);

CREATE INDEX IF NOT EXISTS organization_addons_tenant_id_idx
  ON public.organization_addons (tenant_id);

ALTER TABLE public.organization_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_addons_tenant_admin ON public.organization_addons;
CREATE POLICY organization_addons_tenant_admin ON public.organization_addons
  FOR ALL TO authenticated
  USING (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tenant_id IS NOT NULL
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT p.tenant_id FROM public.profiles p
      WHERE p.id = auth.uid() AND p.tenant_id IS NOT NULL
    )
  );
