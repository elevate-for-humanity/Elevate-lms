-- Enable RLS and add policies for 13 tables that lack them.
-- Categories:
--   Public read + admin write: marketplace_items, mentors, scholarships,
--     program_outcomes, program_requirements, program_tasks, required_documents
--   Admin only: automated_decisions, automation_rulesets, documents_extractions,
--     review_queue, shop_routing_scores
--   User-scoped: idempotency_keys

BEGIN;

-- ============================================================
-- PUBLIC READ + ADMIN WRITE (catalog/reference data)
-- ============================================================

-- marketplace_items
ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_items_public_read" ON marketplace_items;
CREATE POLICY "marketplace_items_public_read" ON marketplace_items
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "marketplace_items_admin_all" ON marketplace_items;
CREATE POLICY "marketplace_items_admin_all" ON marketplace_items
  FOR ALL TO authenticated USING (public.is_admin());

-- mentors
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mentors_public_read" ON mentors;
CREATE POLICY "mentors_public_read" ON mentors
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "mentors_own_update" ON mentors;
CREATE POLICY "mentors_own_update" ON mentors
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "mentors_admin_all" ON mentors;
CREATE POLICY "mentors_admin_all" ON mentors
  FOR ALL TO authenticated USING (public.is_admin());

-- scholarships
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scholarships_public_read" ON scholarships;
CREATE POLICY "scholarships_public_read" ON scholarships
  FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "scholarships_admin_all" ON scholarships;
CREATE POLICY "scholarships_admin_all" ON scholarships
  FOR ALL TO authenticated USING (public.is_admin());

-- program_outcomes
ALTER TABLE program_outcomes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "program_outcomes_public_read" ON program_outcomes;
CREATE POLICY "program_outcomes_public_read" ON program_outcomes
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "program_outcomes_admin_all" ON program_outcomes;
CREATE POLICY "program_outcomes_admin_all" ON program_outcomes
  FOR ALL TO authenticated USING (public.is_admin());

-- program_requirements
ALTER TABLE program_requirements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "program_requirements_public_read" ON program_requirements;
CREATE POLICY "program_requirements_public_read" ON program_requirements
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "program_requirements_admin_all" ON program_requirements;
CREATE POLICY "program_requirements_admin_all" ON program_requirements
  FOR ALL TO authenticated USING (public.is_admin());

-- program_tasks
ALTER TABLE program_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "program_tasks_public_read" ON program_tasks;
CREATE POLICY "program_tasks_public_read" ON program_tasks
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "program_tasks_admin_all" ON program_tasks;
CREATE POLICY "program_tasks_admin_all" ON program_tasks
  FOR ALL TO authenticated USING (public.is_admin());

-- required_documents
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "required_documents_public_read" ON required_documents;
CREATE POLICY "required_documents_public_read" ON required_documents
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "required_documents_admin_all" ON required_documents;
CREATE POLICY "required_documents_admin_all" ON required_documents
  FOR ALL TO authenticated USING (public.is_admin());

-- ============================================================
-- ADMIN ONLY (internal workflow tables)
-- ============================================================

-- automated_decisions
ALTER TABLE automated_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "automated_decisions_admin_all" ON automated_decisions;
CREATE POLICY "automated_decisions_admin_all" ON automated_decisions
  FOR ALL TO authenticated USING (public.is_admin());

-- automation_rulesets
ALTER TABLE automation_rulesets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "automation_rulesets_admin_all" ON automation_rulesets;
CREATE POLICY "automation_rulesets_admin_all" ON automation_rulesets
  FOR ALL TO authenticated USING (public.is_admin());

-- documents_extractions
ALTER TABLE documents_extractions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents_extractions_admin_all" ON documents_extractions;
CREATE POLICY "documents_extractions_admin_all" ON documents_extractions
  FOR ALL TO authenticated USING (public.is_admin());

-- review_queue
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "review_queue_admin_all" ON review_queue;
CREATE POLICY "review_queue_admin_all" ON review_queue
  FOR ALL TO authenticated USING (public.is_admin());

-- shop_routing_scores
ALTER TABLE shop_routing_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shop_routing_scores_admin_all" ON shop_routing_scores;
CREATE POLICY "shop_routing_scores_admin_all" ON shop_routing_scores
  FOR ALL TO authenticated USING (public.is_admin());

-- ============================================================
-- USER-SCOPED
-- ============================================================

-- idempotency_keys (user can only see/create their own)
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "idempotency_keys_own" ON idempotency_keys;
CREATE POLICY "idempotency_keys_own" ON idempotency_keys
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "idempotency_keys_admin_all" ON idempotency_keys;
CREATE POLICY "idempotency_keys_admin_all" ON idempotency_keys
  FOR ALL TO authenticated USING (public.is_admin());

COMMIT;
