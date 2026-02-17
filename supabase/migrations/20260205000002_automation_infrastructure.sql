-- ============================================
-- Automation Infrastructure Tables
-- Evidence processing, review queue, and automated decisions
-- ============================================

-- ============================================
-- 1. Automated Decisions Table
-- Records every automated decision for audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS automated_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'document', 'partner', 'application', 'enrollment'
  entity_id UUID NOT NULL,
  decision_type TEXT NOT NULL, -- 'document_approval', 'partner_approval', 'shop_assignment', etc.
  outcome TEXT NOT NULL, -- 'approved', 'routed_to_review', 'rejected'
  actor TEXT NOT NULL DEFAULT 'system', -- 'system' or user_id for human decisions
  ruleset_version TEXT NOT NULL,
  confidence_score DECIMAL(5,4), -- 0.0000 to 1.0000
  reason_codes TEXT[] DEFAULT '{}',
  input_snapshot JSONB DEFAULT '{}', -- Snapshot of input data at decision time
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_automated_decisions_entity ON automated_decisions(entity_type, entity_id);
CREATE INDEX idx_automated_decisions_type ON automated_decisions(decision_type);
CREATE INDEX idx_automated_decisions_outcome ON automated_decisions(outcome);
CREATE INDEX idx_automated_decisions_created ON automated_decisions(created_at DESC);

COMMENT ON TABLE automated_decisions IS 'Immutable record of all automated decisions for audit and compliance';

-- ============================================
-- 2. Review Queue Table
-- Items requiring human review
-- ============================================
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'document', 'partner', 'application'
  entity_id UUID NOT NULL,
  review_type TEXT NOT NULL, -- 'document_verification', 'partner_approval', 'shop_assignment'
  priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'escalated'
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  
  -- Context for reviewer
  extracted_data JSONB DEFAULT '{}',
  confidence_score DECIMAL(5,4),
  failed_rules TEXT[] DEFAULT '{}',
  system_recommendation TEXT,
  context JSONB DEFAULT '{}',
  
  -- Resolution
  resolution TEXT, -- 'approved', 'rejected', 'reupload_requested'
  resolution_reason TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_priority ON review_queue(priority, created_at);
CREATE INDEX idx_review_queue_entity ON review_queue(entity_type, entity_id);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to) WHERE assigned_to IS NOT NULL;

COMMENT ON TABLE review_queue IS 'Queue of items requiring human review with context and recommendations';

-- ============================================
-- 3. Shop Recommendations Table
-- Persisted routing recommendations
-- ============================================
CREATE TABLE IF NOT EXISTS shop_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  rank INTEGER NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  distance_miles DECIMAL(10,2),
  factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shop_recommendations_app ON shop_recommendations(application_id);
CREATE INDEX idx_shop_recommendations_shop ON shop_recommendations(shop_id);
CREATE UNIQUE INDEX idx_shop_recommendations_unique ON shop_recommendations(application_id, shop_id);

COMMENT ON TABLE shop_recommendations IS 'Persisted shop routing recommendations for applications';

-- ============================================
-- 4. Partner Documents Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'uploaded', 'verified', 'rejected'
  extracted_data JSONB DEFAULT '{}',
  ocr_confidence DECIMAL(5,4),
  verified_at TIMESTAMPTZ,
  verified_by TEXT, -- 'system' or user_id
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_documents_partner ON partner_documents(partner_id);
CREATE INDEX idx_partner_documents_type ON partner_documents(document_type);
CREATE INDEX idx_partner_documents_status ON partner_documents(status);

-- ============================================
-- 5. Partner MOUs Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_mous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'signed', 'expired', 'revoked'
  document_url TEXT,
  signed_document_url TEXT,
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signed_by TEXT,
  signature_ip TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_partner_mous_partner ON partner_mous(partner_id);
CREATE INDEX idx_partner_mous_status ON partner_mous(status);

-- ============================================
-- 6. Apprentice Placements Table (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS apprentice_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID,
  apprentice_id UUID NOT NULL,
  shop_id UUID NOT NULL,
  program_id UUID NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'terminated', 'transferred'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by TEXT, -- 'system' or user_id
  start_date DATE,
  end_date DATE,
  termination_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apprentice_placements_apprentice ON apprentice_placements(apprentice_id);
CREATE INDEX idx_apprentice_placements_shop ON apprentice_placements(shop_id);
CREATE INDEX idx_apprentice_placements_status ON apprentice_placements(status);
CREATE UNIQUE INDEX idx_apprentice_placements_active ON apprentice_placements(apprentice_id, program_id) 
  WHERE status = 'active';

-- ============================================
-- 7. Add columns to documents table
-- ============================================
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by TEXT;

-- ============================================
-- 8. Add columns to partners table
-- ============================================
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS lng DECIMAL(10,7),
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;

-- ============================================
-- 9. RLS Policies
-- ============================================

-- Automated decisions: read-only for admins
ALTER TABLE automated_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view automated decisions" ON automated_decisions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert automated decisions" ON automated_decisions
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- Review queue: admins can view and update
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view review queue" ON review_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Admins can update review queue" ON review_queue
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "System can insert review queue" ON review_queue
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- Shop recommendations: admins can view
ALTER TABLE shop_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view shop recommendations" ON shop_recommendations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Partner documents: partners can view own, admins can view all
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own documents" ON partner_documents
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all partner documents" ON partner_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Partner MOUs: partners can view own, admins can view all
ALTER TABLE partner_mous ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own MOUs" ON partner_mous
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all MOUs" ON partner_mous
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Apprentice placements
ALTER TABLE apprentice_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apprentices can view own placements" ON apprentice_placements
  FOR SELECT
  USING (apprentice_id = auth.uid());

CREATE POLICY "Partners can view their shop placements" ON apprentice_placements
  FOR SELECT
  USING (
    shop_id IN (
      SELECT partner_id FROM partner_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all placements" ON apprentice_placements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ============================================
-- 10. Grants
-- ============================================
GRANT SELECT ON automated_decisions TO authenticated;
GRANT SELECT, UPDATE ON review_queue TO authenticated;
GRANT SELECT ON shop_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON partner_documents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON partner_mous TO authenticated;
GRANT SELECT ON apprentice_placements TO authenticated;

-- Service role needs full access for automation
GRANT ALL ON automated_decisions TO service_role;
GRANT ALL ON review_queue TO service_role;
GRANT ALL ON shop_recommendations TO service_role;
GRANT ALL ON partner_documents TO service_role;
GRANT ALL ON partner_mous TO service_role;
GRANT ALL ON apprentice_placements TO service_role;

-- ============================================
-- 11. Documentation
-- ============================================
COMMENT ON COLUMN automated_decisions.input_snapshot IS 'Complete snapshot of input data at decision time for audit reconstruction';
COMMENT ON COLUMN automated_decisions.reason_codes IS 'Array of reason codes explaining the decision';
COMMENT ON COLUMN review_queue.system_recommendation IS 'AI/rule-based recommendation for the reviewer';
COMMENT ON COLUMN review_queue.failed_rules IS 'Array of rules that failed, triggering review';
