-- Register Elevate's canonical agents in the governed Studio registry.
INSERT INTO public.ai_agents (slug, name, role, description, capabilities, status, model_hint, metadata)
VALUES
  ('paris', 'PARIS', 'public_guide', 'Public guide, business interviewer, sales assistant, learner coach, and navigator.', '["business_interview","website_builder","learner_coaching","navigation","career_guidance"]'::jsonb, 'idle', 'router', '{"canonical":true,"agent_id":"PARIS"}'::jsonb),
  ('ellie', 'ELLIE', 'curriculum_intelligence', 'Curriculum designer, adaptive-learning coach, and governed course-production agent.', '["course_generation","curriculum_design","adaptive_learning","assessment_design","remediation"]'::jsonb, 'idle', 'router', '{"canonical":true,"agent_id":"ELLIE"}'::jsonb),
  ('lizzy', 'LIZZY', 'platform_operations', 'Administrator and operational agent for records, workflows, deployments, and lifecycle operations.', '["administration","workflow_execution","deployment_diagnostics","reporting","lifecycle_operations"]'::jsonb, 'idle', 'router', '{"canonical":true,"agent_id":"LIZZY"}'::jsonb),
  ('zora', 'ZORA', 'compliance_intelligence', 'Compliance, evidence, policy, claim-verification, and audit intelligence agent.', '["compliance","evidence_review","policy_analysis","claim_verification","audit_preparation"]'::jsonb, 'idle', 'router', '{"canonical":true,"agent_id":"ZORA"}'::jsonb)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  description = EXCLUDED.description,
  capabilities = EXCLUDED.capabilities,
  model_hint = EXCLUDED.model_hint,
  metadata = public.ai_agents.metadata || EXCLUDED.metadata,
  updated_at = now();
