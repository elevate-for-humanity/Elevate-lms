-- QA-ONLY audit sink structural stage. No production audit rows or triggers copied.
SET LOCAL search_path=public,extensions;
CREATE TABLE public."audit_failures" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "context" text,
  "error_message" text,
  "original_event" jsonb,
  "resolved" boolean DEFAULT false,
  "resolved_at" timestamp with time zone,
  "resolved_by" uuid
);
ALTER TABLE public."audit_failures" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."audit_failures" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public."audit_failures" TO service_role;
CREATE TABLE public."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "action" text NOT NULL,
  "actor_id" uuid,
  "target_type" text,
  "target_id" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "ip_address" inet,
  "user_agent" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "actor_role" text,
  "entity" text,
  "resource_type" text,
  "resource_id" text,
  "user_id" uuid,
  "details" jsonb,
  "event_type" text,
  "before_state" jsonb,
  "after_state" jsonb,
  "actor_email" text,
  "program_id" uuid,
  "student_id" uuid,
  "entity_id" text,
  "entity_type" text,
  "changes" jsonb,
  "actor_user_id" uuid,
  "meta" jsonb,
  "subject" text,
  "who" text,
  "notes" text,
  "status" text,
  "reason" text,
  "creator_email" text,
  "email_sent" boolean,
  "timestamp" timestamp with time zone,
  "count" integer,
  "steps_generated" integer,
  "title" text,
  "type" text,
  "agreements_signed" boolean,
  "total_courses" integer,
  "successful" integer,
  "failed" integer,
  "forced" boolean,
  "program_title" text,
  "eligible" boolean,
  "funding_types" text,
  "state" text,
  "stage" text,
  "career_interest" text,
  "source" text,
  "week_ending" text,
  "hours_worked" numeric,
  "hours" numeric,
  "credential_type" text,
  "viewer_role" text,
  "ip" text,
  "email" text,
  "results_count" integer,
  "share_link_id" text,
  "tenant_id" uuid,
  "role" text,
  "success" boolean DEFAULT true,
  "action_type" text,
  "description" text,
  "old_data" jsonb,
  "new_data" jsonb,
  "actor_type" text
);
ALTER TABLE public."audit_logs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."audit_logs" FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON TABLE public."audit_logs" TO service_role;
ALTER TABLE public."audit_failures" ADD CONSTRAINT "audit_failures_pkey" PRIMARY KEY (id);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY (id);
CREATE INDEX idx_audit_failures_unresolved ON public.audit_failures USING btree (created_at DESC) WHERE (resolved = false);
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);
CREATE INDEX idx_audit_logs_action_ts ON public.audit_logs USING btree (action, created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs USING btree (action_type, created_at DESC) WHERE (action_type IS NOT NULL);
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs USING btree (actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id);
CREATE INDEX idx_audit_logs_target ON public.audit_logs USING btree (target_type, target_id);
CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs USING btree (tenant_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

