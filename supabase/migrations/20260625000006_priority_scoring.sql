-- Priority scoring system for admin operational items.
-- Scores are computed by a DB function and stored in admin_priority_queue
-- so the dashboard can ORDER BY score DESC without client-side logic.
--
-- Scoring model:
--   compliance_risk  × 5   (FERPA, WIOA, policy violations)
--   days_overdue     × 2   (time since SLA threshold breached)
--   revenue_impact   × 3   (enrollment blocked = revenue at risk)
--   user_blocked     × 10  (learner cannot progress until resolved)
--
-- SLA thresholds:
--   enrollment review:   72 hours
--   compliance alert:    24 hours (critical), 72 hours (high)
--   WIOA document:       48 hours
--   stale CRM lead:      5 days
--   job queue failure:   1 hour

-- ── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_priority_queue (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type         text        NOT NULL,
    -- 'enrollment_review' | 'compliance_alert' | 'wioa_document'
    -- | 'stale_lead' | 'job_failure' | 'missing_document' | 'inactive_learner'
  reference_id      uuid        NOT NULL,   -- FK to the source row
  reference_table   text        NOT NULL,   -- source table name
  title             text        NOT NULL,   -- human-readable label
  href              text        NOT NULL,   -- direct admin link
  priority_score    integer     NOT NULL DEFAULT 0,
  compliance_risk   integer     NOT NULL DEFAULT 0 CHECK (compliance_risk BETWEEN 0 AND 5),
  days_overdue      integer     NOT NULL DEFAULT 0,
  revenue_impact    integer     NOT NULL DEFAULT 0 CHECK (revenue_impact BETWEEN 0 AND 5),
  user_blocked      boolean     NOT NULL DEFAULT false,
  severity          text        CHECK (severity IN ('critical','high','medium','low')),
  resolved          boolean     NOT NULL DEFAULT false,
  resolved_at       timestamptz,
  resolved_by       uuid        REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
  -- Prevent duplicate entries for the same source row
);

-- ── Score computation ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_priority_score(
  p_compliance_risk integer,
  p_days_overdue    integer,
  p_revenue_impact  integer,
  p_user_blocked    boolean
) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT
    (p_compliance_risk * 5) +
    (p_days_overdue    * 2) +
    (p_revenue_impact  * 3) +
    (CASE WHEN p_user_blocked THEN 10 ELSE 0 END);
$$;

-- ── Auto-update score on row change ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.refresh_priority_score()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.priority_score := public.compute_priority_score(
    NEW.compliance_risk,
    NEW.days_overdue,
    NEW.revenue_impact,
    NEW.user_blocked
  );
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_priority_score ON public.admin_priority_queue;
CREATE TRIGGER trg_refresh_priority_score
  BEFORE INSERT OR UPDATE ON public.admin_priority_queue
  FOR EACH ROW EXECUTE FUNCTION public.refresh_priority_score();

-- ── Populate queue from live system state ─────────────────────────────────────
-- Called by a scheduled job or on-demand from /api/admin/priority-queue/refresh.
-- Safe to run repeatedly — uses INSERT ... ON CONFLICT DO UPDATE.
-- NOTE: Column names corrected to match live DB schema:
--   applications: first_name + last_name (no full_name)
--   compliance_alerts: title (not message), status != 'resolved' (not resolved boolean)
--   leads: first_name + last_name (no company_name/contact_name), status (not stage)
CREATE OR REPLACE FUNCTION public.refresh_admin_priority_queue()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  sla_enrollment_hrs  constant integer := 72;
  sla_alert_crit_hrs  constant integer := 24;
  sla_alert_high_hrs  constant integer := 72;
  sla_wioa_hrs        constant integer := 48;
  sla_lead_days       constant integer := 5;
BEGIN

  -- ── Enrollment reviews ────────────────────────────────────────────────────
  INSERT INTO public.admin_priority_queue
    (item_type, reference_id, reference_table, title, href,
     compliance_risk, days_overdue, revenue_impact, user_blocked, severity)
  SELECT
    'enrollment_review', a.id, 'applications',
    'Review enrollment: ' || COALESCE(NULLIF(TRIM(a.first_name || ' ' || a.last_name), ''), a.email, 'Applicant'),
    '/admin/applications/' || a.id,
    1,
    GREATEST(0, EXTRACT(EPOCH FROM (now() - a.created_at))::integer / 3600 - sla_enrollment_hrs) / 24,
    3, true, 'high'
  FROM public.applications a
  WHERE a.status IN ('submitted', 'pending', 'in_review')
  ON CONFLICT (item_type, reference_id) DO UPDATE SET
    days_overdue = EXCLUDED.days_overdue, updated_at = now();

  -- ── Compliance alerts ─────────────────────────────────────────────────────
  INSERT INTO public.admin_priority_queue
    (item_type, reference_id, reference_table, title, href,
     compliance_risk, days_overdue, revenue_impact, user_blocked, severity)
  SELECT
    'compliance_alert', ca.id, 'compliance_alerts',
    COALESCE(ca.title, 'Compliance alert: ' || COALESCE(ca.alert_type, 'unknown')),
    '/admin/compliance',
    CASE ca.severity WHEN 'critical' THEN 5 WHEN 'high' THEN 4 WHEN 'medium' THEN 2 ELSE 1 END,
    CASE ca.severity
      WHEN 'critical' THEN GREATEST(0, EXTRACT(EPOCH FROM (now() - ca.created_at))::integer / 3600 - sla_alert_crit_hrs) / 24
      ELSE GREATEST(0, EXTRACT(EPOCH FROM (now() - ca.created_at))::integer / 3600 - sla_alert_high_hrs) / 24
    END,
    0, false, ca.severity
  FROM public.compliance_alerts ca
  WHERE ca.status != 'resolved'
  ON CONFLICT (item_type, reference_id) DO UPDATE SET
    days_overdue = EXCLUDED.days_overdue, compliance_risk = EXCLUDED.compliance_risk, updated_at = now();

  -- ── WIOA documents ────────────────────────────────────────────────────────
  INSERT INTO public.admin_priority_queue
    (item_type, reference_id, reference_table, title, href,
     compliance_risk, days_overdue, revenue_impact, user_blocked, severity)
  SELECT
    'wioa_document', wd.id, 'wioa_documents',
    'WIOA document pending: ' || COALESCE(wd.document_type, 'document'),
    '/admin/wioa/documents',
    3,
    GREATEST(0, EXTRACT(EPOCH FROM (now() - wd.created_at))::integer / 3600 - sla_wioa_hrs) / 24,
    2, true, 'high'
  FROM public.wioa_documents wd
  WHERE wd.status = 'pending'
  ON CONFLICT (item_type, reference_id) DO UPDATE SET
    days_overdue = EXCLUDED.days_overdue, updated_at = now();

  -- ── Stale CRM leads ───────────────────────────────────────────────────────
  INSERT INTO public.admin_priority_queue
    (item_type, reference_id, reference_table, title, href,
     compliance_risk, days_overdue, revenue_impact, user_blocked, severity)
  SELECT
    'stale_lead', l.id, 'leads',
    'Stale lead: ' || COALESCE(NULLIF(TRIM(l.first_name || ' ' || l.last_name), ''), l.email, 'Lead'),
    '/admin/crm/leads/' || l.id,
    0,
    GREATEST(0, EXTRACT(EPOCH FROM (now() - l.updated_at))::integer / 86400 - sla_lead_days),
    2, false, 'medium'
  FROM public.leads l
  WHERE l.status NOT IN ('closed_won', 'closed_lost', 'Closed Won', 'Closed Lost')
    AND l.updated_at < now() - (sla_lead_days || ' days')::interval
  ON CONFLICT (item_type, reference_id) DO UPDATE SET
    days_overdue = EXCLUDED.days_overdue, updated_at = now();

  -- ── Failed jobs ───────────────────────────────────────────────────────────
  INSERT INTO public.admin_priority_queue
    (item_type, reference_id, reference_table, title, href,
     compliance_risk, days_overdue, revenue_impact, user_blocked, severity)
  SELECT
    'job_failure', jq.id, 'job_queue',
    'Failed job: ' || jq.type,
    '/admin/system/jobs',
    1,
    GREATEST(0, EXTRACT(EPOCH FROM (now() - jq.created_at))::integer / 3600),
    1, false, 'high'
  FROM public.job_queue jq
  WHERE jq.status = 'failed'
  ON CONFLICT (item_type, reference_id) DO UPDATE SET
    days_overdue = EXCLUDED.days_overdue, updated_at = now();

  -- ── Mark resolved items ───────────────────────────────────────────────────
  UPDATE public.admin_priority_queue q SET resolved = true, resolved_at = now()
  WHERE q.item_type = 'enrollment_review' AND q.resolved = false
    AND NOT EXISTS (SELECT 1 FROM public.applications a WHERE a.id = q.reference_id AND a.status IN ('submitted','pending','in_review'));

  UPDATE public.admin_priority_queue q SET resolved = true, resolved_at = now()
  WHERE q.item_type = 'compliance_alert' AND q.resolved = false
    AND NOT EXISTS (SELECT 1 FROM public.compliance_alerts ca WHERE ca.id = q.reference_id AND ca.status != 'resolved');

  UPDATE public.admin_priority_queue q SET resolved = true, resolved_at = now()
  WHERE q.item_type = 'wioa_document' AND q.resolved = false
    AND NOT EXISTS (SELECT 1 FROM public.wioa_documents wd WHERE wd.id = q.reference_id AND wd.status = 'pending');

  UPDATE public.admin_priority_queue q SET resolved = true, resolved_at = now()
  WHERE q.item_type = 'stale_lead' AND q.resolved = false
    AND NOT EXISTS (
      SELECT 1 FROM public.leads l WHERE l.id = q.reference_id
        AND l.status NOT IN ('closed_won','closed_lost','Closed Won','Closed Lost')
        AND l.updated_at < now() - (sla_lead_days || ' days')::interval
    );

  UPDATE public.admin_priority_queue q SET resolved = true, resolved_at = now()
  WHERE q.item_type = 'job_failure' AND q.resolved = false
    AND NOT EXISTS (SELECT 1 FROM public.job_queue jq WHERE jq.id = q.reference_id AND jq.status = 'failed');

END;
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.admin_priority_queue ENABLE ROW LEVEL SECURITY;

DROP policy if exists "admin_read_priority_queue" on public.admin_priority_queue;
DROP policy if exists "admin_read_priority_queue" on public.admin_priority_queue;
CREATE policy "admin_read_priority_queue" on public.admin_priority_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','super_admin','staff')
    )
  );

DROP policy if exists "admin_write_priority_queue" on public.admin_priority_queue;
DROP policy if exists "admin_write_priority_queue" on public.admin_priority_queue;
CREATE policy "admin_write_priority_queue" on public.admin_priority_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin','super_admin')
    )
  );

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_apq_score_unresolved
  ON public.admin_priority_queue (priority_score DESC)
  WHERE resolved = false;

CREATE INDEX IF NOT EXISTS idx_apq_type_resolved
  ON public.admin_priority_queue (item_type, resolved);

