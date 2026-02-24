-- Migration: Create 11 tables referenced in code but missing from all migration files
-- These tables are queried by API routes and libraries but had no CREATE TABLE definition.

CREATE TABLE IF NOT EXISTS compliance_evidence (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  item_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS course_leaderboard (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL,
  user_id uuid NOT NULL,
  progress_percent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_templates (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  tenant_id uuid,
  "key" text NOT NULL,
  subject text,
  body text,
  html text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS global_leaderboard (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  avg_progress numeric DEFAULT 0,
  total_courses integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard_scores (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  points integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_goals (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  daily_minutes integer DEFAULT 20,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lesson_answers (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  question_id uuid NOT NULL,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS partner_seat_orders (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  partner_course_id uuid NOT NULL,
  quantity integer DEFAULT 1,
  status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS security_scan_events (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "type" text NOT NULL,
  tool text,
  status text NOT NULL,
  findings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS signature_documents (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "type" text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_for_org uuid,
  created_by uuid NOT NULL,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS video_bookmarks (  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  label text,
  position_seconds integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
