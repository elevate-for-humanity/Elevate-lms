-- License Audit Log Table
-- Tracks all license-related operations for security and compliance

CREATE TABLE IF NOT EXISTS public.license_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
  tenant_id UUID,
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_license_audit_log_event ON public.license_audit_log(event);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_license_id ON public.license_audit_log(license_id);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_tenant_id ON public.license_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_created_at ON public.license_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_license_audit_log_ip_address ON public.license_audit_log(ip_address);

-- Enable RLS
ALTER TABLE public.license_audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can write audit logs
CREATE POLICY "Service role can manage audit logs"
  ON public.license_audit_log
  FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can read audit logs for their tenant
CREATE POLICY "Admins can read tenant audit logs"
  ON public.license_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
      AND (
        profiles.tenant_id = license_audit_log.tenant_id
        OR profiles.role = 'super_admin'
      )
    )
  );

-- Partition hint for future scaling (comment for now)
-- COMMENT ON TABLE public.license_audit_log IS 'Consider partitioning by created_at for large deployments';

-- Retention policy function (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.license_audit_log
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.license_audit_log IS 'Audit trail for all license operations';
