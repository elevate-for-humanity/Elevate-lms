-- ============================================================================
-- PHASE 1: TENANT ISOLATION — Add tenant_id to core LMS tables
-- ============================================================================
-- Run this FIRST in Supabase SQL Editor.
-- Adds tenant_id (uuid, nullable, FK to tenants) to 7 tables that lack it.
-- These are the tables through which cross-tenant data leaks.
-- ============================================================================

-- 1. courses (43 rows) — the root leak
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_courses_tenant_id ON courses(tenant_id);

-- 2. lessons (514 rows) — content under courses
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_lessons_tenant_id ON lessons(tenant_id);

-- 3. modules (21 rows) — course structure
ALTER TABLE modules
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_modules_tenant_id ON modules(tenant_id);

-- 4. assignments (5 rows) — student work
ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_assignments_tenant_id ON assignments(tenant_id);

-- 5. grades (0 rows) — assessment records
ALTER TABLE grades
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_grades_tenant_id ON grades(tenant_id);

-- 6. job_placements (0 rows) — workforce outcomes
ALTER TABLE job_placements
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_job_placements_tenant_id ON job_placements(tenant_id);

-- 7. notifications (0 rows) — user notifications
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
