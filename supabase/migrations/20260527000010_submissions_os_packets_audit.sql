-- External Submissions OS — Phase 5: Packets, Review Tasks, Submission Controls, Audit Logs

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_packets
-- One packet per opportunity. Assembles all generated documents and attachments.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_submission_packets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  opportunity_id   UUID NOT NULL REFERENCES public.sos_opportunities(id) ON DELETE CASCADE,
  packet_status    TEXT NOT NULL DEFAULT 'building'
                   CHECK (packet_status IN (
                     'building','review','ready','blocked',
                     'submitted','withdrawn','archived'
                   )),
  created_by       UUID REFERENCES auth.users(id),
  submitted_by     UUID REFERENCES auth.users(id),
  submitted_at     TIMESTAMPTZ,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_packets_org_status
  ON public.sos_submission_packets (organization_id, packet_status);

ALTER TABLE public.sos_submission_packets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_packets_admin" ON public.sos_submission_packets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- generated_documents
-- Each document produced for a packet. Tracks template used and review status.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_generated_documents (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_packet_id UUID NOT NULL REFERENCES public.sos_submission_packets(id) ON DELETE CASCADE,
  template_id          UUID REFERENCES public.sos_document_templates(id),
  document_type        TEXT NOT NULL,
  title                TEXT NOT NULL,
  content_html         TEXT,
  output_file_url      TEXT,
  output_file_path     TEXT,
  review_status        TEXT NOT NULL DEFAULT 'pending'
                       CHECK (review_status IN ('pending','approved','rejected','superseded')),
  reviewed_by          UUID REFERENCES auth.users(id),
  reviewed_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_gen_docs_packet
  ON public.sos_generated_documents (submission_packet_id, review_status);

ALTER TABLE public.sos_generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_gen_docs_admin" ON public.sos_generated_documents FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- document_data_sources
-- Every value inserted into a generated document is logged here.
-- Rule 4: every generated document must record the source of each inserted value.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_document_data_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_document_id UUID NOT NULL REFERENCES public.sos_generated_documents(id) ON DELETE CASCADE,
  source_type           TEXT NOT NULL CHECK (source_type IN (
                          'org_field','org_fact','content_block',
                          'attachment','past_performance','rate_sheet',
                          'compliance_record','manual_input','template_static'
                        )),
  source_id             UUID,
  field_name            TEXT NOT NULL,   -- merge field key, e.g. 'org.legal_name'
  inserted_value        TEXT,            -- the actual value that was inserted
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_data_sources_doc
  ON public.sos_document_data_sources (generated_document_id);

ALTER TABLE public.sos_document_data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_data_sources_admin" ON public.sos_document_data_sources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- review_tasks
-- Exception queue. Created whenever a requirement cannot be auto-resolved.
-- Rule: system halts and creates a task instead of inventing an answer.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_review_tasks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.sos_organizations(id) ON DELETE CASCADE,
  opportunity_id       UUID REFERENCES public.sos_opportunities(id),
  submission_packet_id UUID REFERENCES public.sos_submission_packets(id),
  task_type            TEXT NOT NULL CHECK (task_type IN (
                         'missing_fact','missing_attachment','narrative_required',
                         'budget_required','signature_required','partner_document',
                         'custom_response','pricing_required','legal_review',
                         'expiring_document','other'
                       )),
  title                TEXT NOT NULL,
  description          TEXT,
  related_record_type  TEXT,
  related_record_id    UUID,
  priority             TEXT NOT NULL DEFAULT 'medium'
                       CHECK (priority IN ('low','medium','high','critical')),
  status               TEXT NOT NULL DEFAULT 'open'
                       CHECK (status IN ('open','in_progress','resolved','waived','cancelled')),
  assigned_to          UUID REFERENCES auth.users(id),
  resolved_by          UUID REFERENCES auth.users(id),
  resolved_at          TIMESTAMPTZ,
  resolution_notes     TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_tasks_org_status
  ON public.sos_review_tasks (organization_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_sos_tasks_packet
  ON public.sos_review_tasks (submission_packet_id, status);

ALTER TABLE public.sos_review_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_tasks_admin" ON public.sos_review_tasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_runs
-- Each attempt to submit a packet. Enforces the safety gate.
-- Rule: may only run if every required item is auto_safe or explicitly approved.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_submission_runs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_packet_id UUID NOT NULL REFERENCES public.sos_submission_packets(id) ON DELETE CASCADE,
  run_status           TEXT NOT NULL DEFAULT 'pending'
                       CHECK (run_status IN (
                         'pending','running','completed','failed',
                         'blocked','cancelled'
                       )),
  submit_mode          TEXT NOT NULL DEFAULT 'manual'
                       CHECK (submit_mode IN ('manual','automated')),
  submitted_by         UUID REFERENCES auth.users(id),
  submitted_at         TIMESTAMPTZ,
  blocked_reason       TEXT,           -- populated when run_status = 'blocked'
  response_log         JSONB,          -- portal response, confirmation numbers, etc.
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_runs_packet
  ON public.sos_submission_runs (submission_packet_id, run_status);

ALTER TABLE public.sos_submission_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_runs_admin" ON public.sos_submission_runs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- submission_audit_logs
-- Rule 5: every submission must produce a permanent audit log.
-- Immutable — no UPDATE or DELETE policies.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sos_submission_audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_run_id UUID REFERENCES public.sos_submission_runs(id),
  organization_id   UUID REFERENCES public.sos_organizations(id),
  event_type        TEXT NOT NULL CHECK (event_type IN (
                      'packet_created','document_generated','fact_inserted',
                      'attachment_included','requirement_mapped',
                      'review_task_created','review_task_resolved',
                      'safety_gate_passed','safety_gate_blocked',
                      'submission_started','submission_completed',
                      'submission_failed','approval_recorded'
                    )),
  event_detail      TEXT,
  source_reference  TEXT,             -- table:id of the source record
  actor_id          UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_audit_run
  ON public.sos_submission_audit_logs (submission_run_id);
CREATE INDEX IF NOT EXISTS idx_sos_audit_org
  ON public.sos_submission_audit_logs (organization_id, created_at DESC);

ALTER TABLE public.sos_submission_audit_logs ENABLE ROW LEVEL SECURITY;

-- Read-only for admins — no delete, no update (immutable audit trail)
CREATE POLICY "sos_audit_admin_select" ON public.sos_submission_audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));
CREATE POLICY "sos_audit_insert" ON public.sos_submission_audit_logs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
      AND role IN ('admin','super_admin','staff')
  ));

COMMENT ON TABLE public.sos_submission_audit_logs IS
  'Immutable audit trail. No UPDATE or DELETE allowed. Every submission run, fact insertion, and approval is recorded here permanently.';
