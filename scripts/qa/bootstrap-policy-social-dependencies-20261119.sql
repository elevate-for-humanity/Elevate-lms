-- QA-ONLY STRUCTURAL DEPENDENCIES, no rows/functions/triggers/policies copied.
-- Target isdgjcdabhxxozarmxta; reviewed source metadata 2026-11-19.
SET LOCAL search_path=public,extensions;

CREATE TABLE public."blog_posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "excerpt" text,
  "content" text NOT NULL,
  "featured_image" text,
  "author_id" uuid,
  "category" text,
  "tags" text[],
  "published" boolean DEFAULT false,
  "published_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "views_count" integer DEFAULT 0,
  "author_name" text,
  "image" text,
  "status" text,
  "share_to_social" boolean DEFAULT true,
  "social_posted_at" timestamp with time zone,
  "social_post_caption" text,
  "reading_time" text,
  "views" text
);
ALTER TABLE public."blog_posts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."blog_posts" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."blog_posts" TO service_role;

CREATE TABLE public."course_pacing_plans" (
  "course_id" uuid NOT NULL,
  "total_weeks" integer NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "release_published_lessons" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "enforce_theory_schedule" boolean DEFAULT false NOT NULL
);
ALTER TABLE public."course_pacing_plans" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."course_pacing_plans" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."course_pacing_plans" TO service_role;

CREATE TABLE public."lms_organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(255) NOT NULL,
  "subdomain" character varying(100),
  "custom_domain" character varying(255),
  "logo_url" text,
  "primary_color" character varying(7) DEFAULT '#3B82F6'::character varying,
  "secondary_color" character varying(7) DEFAULT '#10B981'::character varying,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "subscription_tier" character varying(50) DEFAULT 'free'::character varying,
  "subscription_status" character varying(50) DEFAULT 'active'::character varying,
  "max_users" integer DEFAULT 100,
  "max_courses" integer DEFAULT 10,
  "storage_limit_gb" integer DEFAULT 10,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."lms_organizations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."lms_organizations" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."lms_organizations" TO service_role;

CREATE TABLE public."organization_users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "status" text DEFAULT 'active'::text NOT NULL,
  "org_id" uuid
);
ALTER TABLE public."organization_users" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."organization_users" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."organization_users" TO service_role;

CREATE TABLE public."partner_users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "partner_id" uuid NOT NULL,
  "role" character varying(20) NOT NULL,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "created_at" timestamp with time zone DEFAULT now(),
  "organization_id" uuid
);
ALTER TABLE public."partner_users" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."partner_users" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."partner_users" TO service_role;

CREATE TABLE public."roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" character varying(100) NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."roles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."roles" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."roles" TO service_role;

CREATE TABLE public."social_campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "platform" text NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "scheduled_posts" integer DEFAULT 0 NOT NULL,
  "published_posts" integer DEFAULT 0 NOT NULL,
  "failed_posts" integer DEFAULT 0 NOT NULL,
  "last_published_at" timestamp with time zone,
  "start_date" timestamp with time zone,
  "end_date" timestamp with time zone,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public."social_campaigns" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."social_campaigns" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."social_campaigns" TO service_role;

CREATE TABLE public."social_media_posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "platform" text NOT NULL,
  "post_type" text DEFAULT 'text'::text,
  "title" text,
  "content" text NOT NULL,
  "media_url" text,
  "blog_post_id" uuid,
  "scheduled_for" timestamp with time zone,
  "published_at" timestamp with time zone,
  "status" text DEFAULT 'draft'::text,
  "external_post_id" text,
  "engagement_data" jsonb DEFAULT '{}'::jsonb,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "source_type" text,
  "source_id" uuid,
  "destination_type" text,
  "destination_id" text,
  "caption" text,
  "hashtags" text[] DEFAULT '{}'::text[] NOT NULL,
  "link_url" text,
  "video_url" text,
  "thumbnail_url" text,
  "generation_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "content_version" text,
  "idempotency_key" text,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp with time zone,
  "claimed_at" timestamp with time zone,
  "claim_token" uuid,
  "published_url" text,
  "last_error_code" text,
  "error_message" text,
  "platform_post_id" text,
  "posted_at" timestamp with time zone,
  "approval_state" text DEFAULT 'pending'::text NOT NULL,
  "approved_at" timestamp with time zone,
  "approved_by" uuid,
  "scheduled_at" timestamp with time zone,
  "claim_expires_at" timestamp with time zone,
  "max_attempts" integer DEFAULT 6 NOT NULL,
  "dead_lettered_at" timestamp with time zone,
  "cta" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "media_refs" jsonb DEFAULT '[]'::jsonb NOT NULL
);
ALTER TABLE public."social_media_posts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."social_media_posts" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."social_media_posts" TO service_role;

CREATE TABLE public."user_roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid,
  "tenant_id" uuid,
  "assigned_by" uuid,
  "assigned_at" timestamp with time zone DEFAULT now(),
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now(),
  "role" text
);
ALTER TABLE public."user_roles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."user_roles" FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."user_roles" TO service_role;
ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY (id);
ALTER TABLE public."blog_posts" ADD CONSTRAINT "blog_posts_slug_key" UNIQUE (slug);
ALTER TABLE public."course_pacing_plans" ADD CONSTRAINT "course_pacing_plans_total_weeks_check" CHECK (total_weeks >= 1 AND total_weeks <= 260);
ALTER TABLE public."course_pacing_plans" ADD CONSTRAINT "course_pacing_plans_pkey" PRIMARY KEY (course_id);
ALTER TABLE public."lms_organizations" ADD CONSTRAINT "lms_organizations_pkey" PRIMARY KEY (id);
ALTER TABLE public."lms_organizations" ADD CONSTRAINT "lms_organizations_custom_domain_key" UNIQUE (custom_domain);
ALTER TABLE public."lms_organizations" ADD CONSTRAINT "lms_organizations_subdomain_key" UNIQUE (subdomain);
ALTER TABLE public."organization_users" ADD CONSTRAINT "organization_users_role_check" CHECK (role = ANY (ARRAY['org_owner'::text, 'org_admin'::text, 'instructor'::text, 'reviewer'::text, 'report_viewer'::text]));
ALTER TABLE public."organization_users" ADD CONSTRAINT "organization_users_status_check" CHECK (status = ANY (ARRAY['active'::text, 'invited'::text, 'suspended'::text, 'removed'::text]));
ALTER TABLE public."organization_users" ADD CONSTRAINT "organization_users_pkey" PRIMARY KEY (id);
ALTER TABLE public."organization_users" ADD CONSTRAINT "organization_users_organization_id_user_id_key" UNIQUE (organization_id, user_id);
ALTER TABLE public."partner_users" ADD CONSTRAINT "partner_users_pkey" PRIMARY KEY (id);
ALTER TABLE public."partner_users" ADD CONSTRAINT "partner_users_user_id_partner_id_key" UNIQUE (user_id, partner_id);
ALTER TABLE public."roles" ADD CONSTRAINT "roles_pkey" PRIMARY KEY (id);
ALTER TABLE public."social_campaigns" ADD CONSTRAINT "social_campaigns_platform_check" CHECK (platform = ANY (ARRAY['facebook'::text, 'instagram'::text, 'linkedin'::text, 'youtube'::text, 'x'::text, 'tiktok'::text, 'multi'::text]));
ALTER TABLE public."social_campaigns" ADD CONSTRAINT "social_campaigns_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'active'::text, 'paused'::text, 'completed'::text, 'failed'::text]));
ALTER TABLE public."social_campaigns" ADD CONSTRAINT "social_campaigns_pkey" PRIMARY KEY (id);
ALTER TABLE public."social_media_posts" ADD CONSTRAINT "social_media_posts_approval_state_check" CHECK (approval_state = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'not_required'::text]));
ALTER TABLE public."social_media_posts" ADD CONSTRAINT "social_media_posts_destination_type_check" CHECK (destination_type IS NULL OR (destination_type = ANY (ARRAY['facebook_page'::text, 'facebook_personal_draft'::text, 'instagram_image'::text, 'instagram_reel'::text, 'google_business_post'::text, 'google_business_photo'::text, 'youtube_video'::text, 'youtube_short'::text, 'linkedin_organization'::text])));
ALTER TABLE public."social_media_posts" ADD CONSTRAINT "social_media_posts_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'approved'::text, 'scheduled'::text, 'queued'::text, 'generating'::text, 'manual_ready'::text, 'publishing'::text, 'published'::text, 'failed'::text, 'dead_letter'::text, 'posted'::text, 'configuration_required'::text]));
ALTER TABLE public."social_media_posts" ADD CONSTRAINT "social_media_posts_pkey" PRIMARY KEY (id);
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (id);
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_role_id_tenant_id_key" UNIQUE (user_id, role_id, tenant_id);
ALTER TABLE public."course_pacing_plans" ADD CONSTRAINT "course_pacing_plans_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT;
ALTER TABLE public."organization_users" ADD CONSTRAINT "organization_users_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public."organization_users" ADD CONSTRAINT "organization_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."partner_users" ADD CONSTRAINT "partner_users_partner_id_fkey" FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;
ALTER TABLE public."social_media_posts" ADD CONSTRAINT "social_media_posts_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE;
ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_tenant_id_fkey" FOREIGN KEY (tenant_id) REFERENCES lms_organizations(id) ON DELETE CASCADE;
CREATE INDEX blog_posts_slug_idx ON public.blog_posts USING btree (slug);
CREATE INDEX blog_posts_status_idx ON public.blog_posts USING btree (status);
CREATE INDEX idx_blog_posts_published ON public.blog_posts USING btree (published) WHERE (published = true);
CREATE INDEX idx_blog_posts_social ON public.blog_posts USING btree (share_to_social, social_posted_at, published_at) WHERE ((share_to_social = true) AND (social_posted_at IS NULL));
CREATE INDEX idx_lms_orgs_custom_domain ON public.lms_organizations USING btree (custom_domain);
CREATE INDEX idx_lms_orgs_subdomain ON public.lms_organizations USING btree (subdomain);
CREATE INDEX idx_organization_users_org_id ON public.organization_users USING btree (organization_id);
CREATE INDEX idx_organization_users_role ON public.organization_users USING btree (role);
CREATE INDEX idx_organization_users_user_id ON public.organization_users USING btree (user_id);
CREATE INDEX idx_partner_users_partner_id ON public.partner_users USING btree (partner_id);
CREATE INDEX idx_partner_users_user_id ON public.partner_users USING btree (user_id);
CREATE INDEX idx_roles_name ON public.roles USING btree (name);
CREATE UNIQUE INDEX idx_roles_name_unique ON public.roles USING btree (name);
CREATE INDEX idx_fk_social_media_posts_9848100ce8 ON public.social_media_posts USING btree (approved_by);
CREATE INDEX idx_social_media_posts_claimable ON public.social_media_posts USING btree (status, next_attempt_at, created_at) WHERE (status = ANY (ARRAY['queued'::text, 'failed'::text]));
CREATE INDEX idx_social_media_posts_due ON public.social_media_posts USING btree (status, scheduled_at, next_attempt_at) WHERE (status = ANY (ARRAY['scheduled'::text, 'queued'::text, 'failed'::text]));
CREATE INDEX idx_social_media_posts_scheduled ON public.social_media_posts USING btree (scheduled_for) WHERE (status = 'scheduled'::text);
CREATE INDEX idx_social_media_posts_source ON public.social_media_posts USING btree (source_type, source_id, destination_type);
CREATE INDEX idx_social_media_posts_status ON public.social_media_posts USING btree (status);
CREATE INDEX idx_social_posts_blog ON public.social_media_posts USING btree (blog_post_id);
CREATE INDEX idx_social_posts_scheduled ON public.social_media_posts USING btree (scheduled_for);
CREATE UNIQUE INDEX uq_social_media_posts_idempotency ON public.social_media_posts USING btree (idempotency_key) WHERE (idempotency_key IS NOT NULL);
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles USING btree (tenant_id);
CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id);

