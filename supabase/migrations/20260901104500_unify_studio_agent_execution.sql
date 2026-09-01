-- Studio exposes one Admin AI. These rows are internal capabilities of that
-- orchestrator, not separate user-selected assistants.
UPDATE public.ai_agents
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'connected', true,
      'orchestrator', 'admin-ai',
      'execution_route', '/api/admin/dev-studio/chat'
    ),
    model_hint = CASE
      WHEN model_hint IS NULL OR model_hint IN ('router', '') THEN 'auto-router'
      ELSE model_hint
    END,
    status = 'idle',
    updated_at = now()
WHERE slug IN (
  'ai-architect',
  'ai-business-operations-manager',
  'ai-compliance-assistant',
  'ai-debugger',
  'ai-developer',
  'ai-devops-engineer',
  'ai-lms-builder',
  'ai-qa-tester',
  'ai-website-manager',
  'ai-workflow-builder',
  'ellie',
  'lizzy',
  'paris',
  'zora'
);
