-- Expanded commerce capability catalog for unified Marketing/LMS/Admin entitlements.
-- Idempotent. Safe to run after 20260702000017_saas_subscription_foundation.sql.

INSERT INTO public.features (code, name, description) VALUES
  ('booking', 'Booking', 'Canonical booking and scheduling capability'),
  ('automations', 'Automations', 'Canonical workflow automation capability'),
  ('website_builder', 'AI Website Builder', 'Create, edit and publish tenant websites'),
  ('website_import', 'Website Import', 'Import an existing public website into the builder'),
  ('custom_domain', 'Custom Domain', 'Connect a customer-owned website domain'),
  ('ai_advanced', 'Advanced AI', 'Advanced AI generation capability'),
  ('ai_content', 'AI Content', 'AI-assisted content generation'),
  ('ai_chat_widget', 'AI Chat Widget', 'Embedded customer-facing AI chat'),
  ('ai_paris', 'PARIS Assistant', 'Sales, intake and admissions assistant'),
  ('ai_ellie', 'ELLIE Assistant', 'Learner and customer support assistant'),
  ('ai_lizzy', 'LIZZY Assistant', 'Operations and administration assistant'),
  ('ai_zora', 'ZORA Assistant', 'Compliance and audit assistant'),
  ('ai_orchestrator', 'AI Team Orchestrator', 'Cross-agent AI task routing'),
  ('ai_voice', 'AI Voice', 'Speech input and spoken AI responses'),
  ('analytics', 'Analytics', 'Organization analytics capability'),
  ('seo_autopilot', 'SEO Autopilot', 'Automated search optimization workflows'),
  ('marketing_autopilot', 'Marketing Autopilot', 'Automated content and campaign workflows'),
  ('course_builder', 'Course Builder', 'Course and curriculum authoring'),
  ('course_factory', 'AI Course Factory', 'AI course, lesson and assessment generation'),
  ('credentials', 'Credentials', 'Credential tracking and verification'),
  ('instructor_tools', 'Instructor Tools', 'Instructor administration and teaching tools'),
  ('media_studio', 'Media Studio', 'Media and creative content workflows'),
  ('compliance', 'Compliance', 'Compliance, audit and accreditation workflows'),
  ('sam_gov_manager', 'SAM.gov Manager', 'Federal entity registration workflow support'),
  ('grants_discovery', 'Grants Discovery', 'Grant discovery and application workflow support'),
  ('dev_studio', 'Dev Studio', 'AI-assisted development and diagnostics'),
  ('deployment_autopilot', 'Deployment Autopilot', 'Deployment monitoring and rollback automation'),
  ('container_management', 'Container Management', 'Managed container operations')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

INSERT INTO public.saas_addon_catalog (code, name, monthly_price, feature_codes, sort_order, active) VALUES
  ('ai-assistant', 'AI Power Pack', 19, ARRAY['ai_advanced','ai_content','ai_chat_widget'], 2, true),
  ('paris-assistant', 'PARIS Sales & Intake Assistant', 19, ARRAY['ai_paris'], 20, true),
  ('ellie-assistant', 'ELLIE Learning & Support Assistant', 19, ARRAY['ai_ellie'], 21, true),
  ('lizzy-assistant', 'LIZZY Operations Assistant', 29, ARRAY['ai_lizzy'], 22, true),
  ('zora-assistant', 'ZORA Compliance Assistant', 29, ARRAY['ai_zora'], 23, true),
  ('ai-team', 'AI Business Team', 79, ARRAY['ai_paris','ai_ellie','ai_lizzy','ai_zora','ai_orchestrator'], 24, true),
  ('ai-voice', 'AI Voice', 15, ARRAY['ai_voice'], 25, true),
  ('course-builder', 'Course Builder', 29, ARRAY['course_builder'], 26, true),
  ('ai-course-factory', 'AI Course Factory', 49, ARRAY['course_factory','course_builder','ai_content'], 27, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  monthly_price = EXCLUDED.monthly_price,
  feature_codes = EXCLUDED.feature_codes,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- Keep legacy feature rows because existing subscriptions may reference them.
-- Application code normalizes bookings->booking, automation->automations and ai->ai_advanced.
