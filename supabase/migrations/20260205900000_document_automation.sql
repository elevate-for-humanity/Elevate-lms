-- Document Automation Tables
-- Stores OCR extractions, automated decisions, and review queue

-- 1. Document Extractions - stores OCR/parsing results
CREATE TABLE IF NOT EXISTS documents_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  doc_type TEXT NOT NULL, -- transcript, license, insurance, mou, id, w2
  extracted JSONB NOT NULL DEFAULT '{}', -- extracted fields
  raw_text TEXT, -- raw OCR text
  confidence NUMERIC(5,4) DEFAULT 0, -- 0.0000 to 1.0000
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'needs_review')),
  validation_errors TEXT[], -- list of validation failures
  ruleset_version TEXT NOT NULL DEFAULT '1.0.0',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_extractions_document ON documents_extractions(document_id);
CREATE INDEX idx_doc_extractions_status ON documents_extractions(status);
CREATE INDEX idx_doc_extractions_doc_type ON documents_extractions(doc_type);

-- 2. Automated Decisions - audit trail for all system decisions
CREATE TABLE IF NOT EXISTS automated_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL, -- application, partner, transfer_hours, routing, document
  subject_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_review', 'recommended', 'assigned', 'flagged')),
  reason_codes TEXT[] NOT NULL DEFAULT '{}',
  input_snapshot JSONB NOT NULL DEFAULT '{}', -- extracted fields + context at decision time
  ruleset_version TEXT NOT NULL DEFAULT '1.0.0',
  actor TEXT NOT NULL DEFAULT 'system',
  overridden_by UUID,
  overridden_at TIMESTAMPTZ,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_decisions_subject ON automated_decisions(subject_type, subject_id);
CREATE INDEX idx_auto_decisions_decision ON automated_decisions(decision);
CREATE INDEX idx_auto_decisions_created ON automated_decisions(created_at DESC);

-- 3. Review Queue - unified queue for human review
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type TEXT NOT NULL, -- transcript_review, partner_docs_review, routing_review, document_review
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
  reasons TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
  assigned_to UUID,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_type ON review_queue(queue_type);
CREATE INDEX idx_review_queue_priority ON review_queue(priority, created_at);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to) WHERE assigned_to IS NOT NULL;

-- 4. Automation Rulesets - versioned rules for audit
CREATE TABLE IF NOT EXISTS automation_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- transcript_approval, partner_approval, shop_routing
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, version)
);

-- 5. Shop Routing Scores - for apprentice-shop matching
CREATE TABLE IF NOT EXISTS shop_routing_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  distance_score NUMERIC(5,2),
  capacity_score NUMERIC(5,2),
  specialty_score NUMERIC(5,2),
  preference_score NUMERIC(5,2),
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  rank INT,
  status TEXT DEFAULT 'recommended' CHECK (status IN ('recommended', 'assigned', 'rejected', 'expired')),
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_scores_app ON shop_routing_scores(application_id);
CREATE INDEX idx_routing_scores_shop ON shop_routing_scores(shop_id);
CREATE INDEX idx_routing_scores_rank ON shop_routing_scores(application_id, rank);

-- 6. Transfer Hours Records
CREATE TABLE IF NOT EXISTS transfer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID,
  enrollment_id UUID,
  source_institution TEXT NOT NULL,
  source_state TEXT NOT NULL,
  total_hours NUMERIC(10,2) NOT NULL,
  approved_hours NUMERIC(10,2),
  document_id UUID,
  extraction_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  auto_approved BOOLEAN DEFAULT false,
  decision_id UUID,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfer_hours_student ON transfer_hours(student_id);
-- transfer_hours has no status column; skip index

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doc_extractions_updated
  BEFORE UPDATE ON documents_extractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_review_queue_updated
  BEFORE UPDATE ON review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_transfer_hours_updated
  BEFORE UPDATE ON transfer_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default rulesets
INSERT INTO automation_rulesets (name, version, rule_type, rules) VALUES
('indiana_transcript_approval', '1.0.0', 'transcript_approval', '{
  "approved_states": ["IN"],
  "max_transfer_hours": 1000,
  "min_confidence": 0.85,
  "require_school_name": true,
  "require_date": true,
  "require_hours": true
}'::jsonb),
('partner_document_approval', '1.0.0', 'partner_approval', '{
  "required_docs": ["shop_license", "partner_mou", "insurance"],
  "license_must_be_valid": true,
  "mou_must_be_signed": true,
  "insurance_optional_states": ["IN"]
}'::jsonb),
('shop_routing', '1.0.0', 'shop_routing', '{
  "max_distance_miles": 25,
  "min_capacity": 1,
  "weights": {
    "distance": 0.3,
    "capacity": 0.2,
    "specialty": 0.3,
    "preference": 0.2
  },
  "auto_assign_threshold": 0.85
}'::jsonb)
ON CONFLICT (name, version) DO NOTHING;
