-- ============================================
-- Platform Audit Events
-- 
-- Centralized audit logging for all sensitive
-- platform operations including AI actions,
-- deployments, and administrative changes.
-- ============================================

create table if not exists public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  
  -- Organization scoping
  organization_id uuid references public.profiles(id) on delete set null,
  
  -- Actor information
  actor_user_id uuid references public.profiles(id) on delete set null,
  actor_type text not null check (actor_type in ('user', 'agent', 'system')),
  actor_name text,
  
  -- Action details
  action text not null,
  resource_type text not null,
  resource_id text,
  
  -- Status tracking
  status text not null check (
    status in ('started', 'succeeded', 'failed', 'denied')
  ),
  
  -- Additional context
  metadata jsonb not null default '{}'::jsonb,
  
  -- IP and user agent for security
  ip_address inet,
  user_agent text,
  
  -- Timestamps
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_audit_events_org_created
  on public.platform_audit_events (organization_id, created_at desc);

create index if not exists idx_audit_events_actor_created
  on public.platform_audit_events (actor_user_id, created_at desc);

create index if not exists idx_audit_events_action
  on public.platform_audit_events (action, created_at desc);

create index if not exists idx_audit_events_resource
  on public.platform_audit_events (resource_type, resource_id);

create index if not exists idx_audit_events_status
  on public.platform_audit_events (status, created_at desc);

-- Comments for documentation
comment on table public.platform_audit_events is 
  'Centralized audit log for all platform operations including AI, deployments, and admin actions';

comment on column public.platform_audit_events.actor_type is 
  '''user'' for human actions, ''agent'' for AI agent actions, ''system'' for automated processes';

comment on column public.platform_audit_events.action is 
  'Action performed (e.g., ''ai.chat.submit'', ''course.publish'', ''deployment.approve'')';

comment on column public.platform_audit_events.resource_type is 
  'Type of resource affected (e.g., ''course'', ''deployment'', ''media_asset'')';

comment on column public.platform_audit_events.metadata is 
  'Additional context as JSON: provider, model, error details, request/response summaries';

-- ============================================
-- Standardized Audit Actions
-- ============================================

-- AI Actions
-- 'ai.chat.submit' - User submitted AI prompt
-- 'ai.chat.response' - AI generated response
-- 'ai.course.generate' - AI generated course content
-- 'ai.content.generate' - AI generated content
-- 'ai.evaluation.start' - AI evaluation started
-- 'ai.evaluation.complete' - AI evaluation completed

-- Course Actions
-- 'course.create' - Course created
-- 'course.update' - Course updated
-- 'course.publish' - Course published
-- 'course.delete' - Course deleted
-- 'lesson.create' - Lesson created
-- 'lesson.update' - Lesson updated
-- 'quiz.create' - Quiz created
-- 'quiz.publish' - Quiz published

-- Media Actions
-- 'media.upload' - Media file uploaded
-- 'media.delete' - Media file deleted
-- 'media.update' - Media metadata updated

-- Deployment Actions
-- 'deployment.request' - Deployment requested
-- 'deployment.approve' - Deployment approved
-- 'deployment.reject' - Deployment rejected
-- 'deployment.start' - Deployment started
-- 'deployment.complete' - Deployment succeeded
-- 'deployment.failed' - Deployment failed

-- Container Actions
-- 'container.create' - Container created
-- 'container.start' - Container started
-- 'container.stop' - Container stopped
-- 'container.delete' - Container deleted

-- Settings Actions
-- 'settings.update' - Settings changed
-- 'secrets.update' - Secrets changed
-- 'provider.update' - Provider configuration changed

-- ============================================
-- Example Queries
-- ============================================

-- Get all AI actions for a user
-- SELECT * FROM platform_audit_events 
-- WHERE actor_user_id = 'uuid' 
-- AND action LIKE 'ai.%'
-- ORDER BY created_at DESC;

-- Get all deployment activity
-- SELECT * FROM platform_audit_events 
-- WHERE resource_type = 'deployment'
-- ORDER BY created_at DESC;

-- Get failed actions
-- SELECT * FROM platform_audit_events 
-- WHERE status = 'failed'
-- ORDER BY created_at DESC
-- LIMIT 100;
