-- Studio Audit Fixes: seed workflow templates, ensure cron_jobs, verify tables
-- Idempotent — safe to re-run.

-- 1. Create workflow_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflow_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  trigger_type  text NOT NULL DEFAULT 'event',
  is_active     boolean NOT NULL DEFAULT true,
  config        jsonb DEFAULT '{}',
  created_by    uuid,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Seed core workflow templates (skip duplicates by name)
INSERT INTO workflow_templates (id, name, description, trigger_type, is_active, created_at)
SELECT gen_random_uuid(), v.name, v.description, v.trigger_type, true, now()
FROM (VALUES
  ('Course Published',    'Fires when a course transitions from draft to published', 'event'),
  ('Student Enrolled',    'Fires when a student enrolls in a course',               'event'),
  ('Student Completed',   'Fires when a student completes all course requirements', 'event'),
  ('Certificate Issued',  'Fires after a certificate is generated and stored',      'event'),
  ('Employer Notified',   'Fires to notify employer of student completion',         'event')
) AS v(name, description, trigger_type)
WHERE NOT EXISTS (SELECT 1 FROM workflow_templates wt WHERE wt.name = v.name);

-- 2. Ensure question_banks table exists for assessment system
CREATE TABLE IF NOT EXISTS question_banks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  course_id   uuid REFERENCES courses(id) ON DELETE SET NULL,
  category    text DEFAULT 'general',
  tags        text[] DEFAULT '{}',
  is_public   boolean DEFAULT false,
  shared_with text[] DEFAULT '{}',
  created_by  uuid,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 3. Ensure course_embeddings table exists for RAG pipeline
CREATE TABLE IF NOT EXISTS course_embeddings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id   uuid,
  content     text,
  embedding   vector(1536),
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Replace IVFFlat with HNSW if the old index exists (IVFFlat needs data to be effective)
DROP INDEX IF EXISTS idx_course_embeddings_embedding;
CREATE INDEX IF NOT EXISTS idx_course_embeddings_embedding
  ON course_embeddings USING hnsw (embedding vector_cosine_ops);

-- 4. RLS on workflow_templates
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='workflow_templates' AND policyname='workflow_templates_admin_all'
  ) THEN
    CREATE POLICY workflow_templates_admin_all ON workflow_templates
      FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
      );
  END IF;
END $$;

-- 5. RLS on question_banks
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='question_banks' AND policyname='question_banks_admin_all'
  ) THEN
    CREATE POLICY question_banks_admin_all ON question_banks
      FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','instructor'))
      );
  END IF;
END $$;

-- 5. RLS on course_embeddings
ALTER TABLE course_embeddings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='course_embeddings' AND policyname='course_embeddings_read_all'
  ) THEN
    CREATE POLICY course_embeddings_read_all ON course_embeddings
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='course_embeddings' AND policyname='course_embeddings_admin_write'
  ) THEN
    CREATE POLICY course_embeddings_admin_write ON course_embeddings
      FOR ALL TO authenticated
      USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
      );
  END IF;
END $$;
