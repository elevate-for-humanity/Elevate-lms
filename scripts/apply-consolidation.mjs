/**
 * Table consolidation — applies each step individually with clear pass/fail.
 * Run: node scripts/apply-consolidation.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function run(label, sql) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SKEY,
      'Authorization': `Bearer ${SKEY}`,
    },
    body: JSON.stringify({ sql }),
  });
  const body = await r.text();
  if (r.ok) {
    console.log('✓', label);
  } else {
    console.log('✗', label, '->', body.slice(0, 200));
  }
}

// ── FAMILY 1: Audit logs ──────────────────────────────────────────────────────
await run('audit_logs: add old_data/new_data columns', `
  ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS old_data jsonb,
    ADD COLUMN IF NOT EXISTS new_data jsonb;
`);

// admin_audit_events was already dropped — view alias already created
// Just verify the view exists
await run('admin_audit_events view alias (idempotent)', `
  CREATE OR REPLACE VIEW public.admin_audit_events AS
  SELECT
    id, action,
    actor_id AS actor_user_id,
    actor_id,
    actor_role,
    target_type,
    target_id,
    metadata,
    ip_address,
    created_at,
    entity_type,
    entity_id,
    old_data,
    new_data
  FROM public.audit_logs;
`);

// ── FAMILY 2: Hours views ─────────────────────────────────────────────────────
await run('Drop apprentice_hours_by_shop view', `DROP VIEW IF EXISTS public.apprentice_hours_by_shop CASCADE;`);
await run('Drop apprentice_hours_by_source view', `DROP VIEW IF EXISTS public.apprentice_hours_by_source CASCADE;`);
await run('Drop apprentice_hour_totals view', `DROP VIEW IF EXISTS public.apprentice_hour_totals CASCADE;`);
await run('Drop apprenticeship_hours_summary view', `DROP VIEW IF EXISTS public.apprenticeship_hours_summary CASCADE;`);

await run('Create apprenticeship_hours_summary view', `
  CREATE OR REPLACE VIEW public.apprenticeship_hours_summary AS
  SELECT
    student_id,
    program_slug,
    date_trunc('week', COALESCE(date_worked, date))::timestamptz AS week_start,
    SUM(COALESCE(hours_worked, hours, 0))                         AS total_hours,
    SUM(CASE WHEN status = 'approved' THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS approved_hours,
    SUM(CASE WHEN status = 'pending'  THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS pending_hours,
    SUM(CASE WHEN status = 'disputed' THEN COALESCE(hours_worked, hours, 0) ELSE 0 END) AS disputed_hours,
    COUNT(*) AS entry_count
  FROM public.apprenticeship_hours
  GROUP BY student_id, program_slug, date_trunc('week', COALESCE(date_worked, date));
`);

// ── FAMILY 3: Missing tables ──────────────────────────────────────────────────
await run('Create wioa_cases', `
  CREATE TABLE IF NOT EXISTS public.wioa_cases (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    case_number    text UNIQUE,
    status         text NOT NULL DEFAULT 'open',
    program_id     uuid REFERENCES public.programs(id),
    assigned_staff uuid REFERENCES public.profiles(id),
    opened_at      timestamptz NOT NULL DEFAULT now(),
    closed_at      timestamptz,
    notes          text,
    metadata       jsonb DEFAULT '{}',
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.wioa_cases ENABLE ROW LEVEL SECURITY;
`);

await run('wioa_cases RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'wioa_cases' AND policyname = 'Staff manage wioa_cases'
    ) THEN
      CREATE POLICY "Staff manage wioa_cases" ON public.wioa_cases FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));
    END IF;
  END $$;
`);

await run('Create workforce_board_cases', `
  CREATE TABLE IF NOT EXISTS public.workforce_board_cases (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wioa_case_id   uuid REFERENCES public.wioa_cases(id),
    participant_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    status         text NOT NULL DEFAULT 'active',
    board_notes    text,
    review_date    date,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.workforce_board_cases ENABLE ROW LEVEL SECURITY;
`);

await run('workforce_board_cases RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'workforce_board_cases' AND policyname = 'Staff manage workforce_board_cases'
    ) THEN
      CREATE POLICY "Staff manage workforce_board_cases" ON public.workforce_board_cases FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));
    END IF;
  END $$;
`);

await run('Create workforce_board_participants', `
  CREATE TABLE IF NOT EXISTS public.workforce_board_participants (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id    uuid REFERENCES public.workforce_board_cases(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role       text NOT NULL DEFAULT 'participant',
    joined_at  timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.workforce_board_participants ENABLE ROW LEVEL SECURITY;
`);

await run('workforce_board_participants RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'workforce_board_participants' AND policyname = 'Staff manage workforce_board_participants'
    ) THEN
      CREATE POLICY "Staff manage workforce_board_participants" ON public.workforce_board_participants FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));
    END IF;
  END $$;
`);

await run('Create workforce_board_notes', `
  CREATE TABLE IF NOT EXISTS public.workforce_board_notes (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id    uuid REFERENCES public.workforce_board_cases(id) ON DELETE CASCADE,
    author_id  uuid REFERENCES public.profiles(id),
    note       text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.workforce_board_notes ENABLE ROW LEVEL SECURITY;
`);

await run('workforce_board_notes RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'workforce_board_notes' AND policyname = 'Staff manage workforce_board_notes'
    ) THEN
      CREATE POLICY "Staff manage workforce_board_notes" ON public.workforce_board_notes FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','org_admin')));
    END IF;
  END $$;
`);

await run('Create ai_planner_tasks', `
  CREATE TABLE IF NOT EXISTS public.ai_planner_tasks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    description text,
    status      text NOT NULL DEFAULT 'pending',
    priority    text NOT NULL DEFAULT 'normal',
    assigned_to uuid REFERENCES public.profiles(id),
    due_date    date,
    metadata    jsonb DEFAULT '{}',
    created_by  uuid REFERENCES public.profiles(id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.ai_planner_tasks ENABLE ROW LEVEL SECURITY;
`);

await run('ai_planner_tasks RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'ai_planner_tasks' AND policyname = 'Staff manage ai_planner_tasks'
    ) THEN
      CREATE POLICY "Staff manage ai_planner_tasks" ON public.ai_planner_tasks FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
    END IF;
  END $$;
`);

await run('Create payout_queue', `
  CREATE TABLE IF NOT EXISTS public.payout_queue (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id uuid REFERENCES public.program_enrollments(id),
    recipient_id  uuid REFERENCES public.profiles(id),
    amount_cents  integer NOT NULL DEFAULT 0,
    status        text NOT NULL DEFAULT 'pending',
    payout_method text,
    notes         text,
    paid_at       timestamptz,
    paid_by       uuid REFERENCES public.profiles(id),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.payout_queue ENABLE ROW LEVEL SECURITY;
`);

await run('payout_queue RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'payout_queue' AND policyname = 'Staff manage payout_queue'
    ) THEN
      CREATE POLICY "Staff manage payout_queue" ON public.payout_queue FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));
    END IF;
  END $$;
`);

await run('Create tenant_configurations', `
  CREATE TABLE IF NOT EXISTS public.tenant_configurations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  text UNIQUE NOT NULL,
    brand_name text NOT NULL,
    domain     text,
    industry   text,
    features   jsonb DEFAULT '[]',
    theme      jsonb DEFAULT '{}',
    config     jsonb DEFAULT '{}',
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  );
  ALTER TABLE public.tenant_configurations ENABLE ROW LEVEL SECURITY;
`);

await run('tenant_configurations RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'tenant_configurations' AND policyname = 'Admins manage tenant_configurations'
    ) THEN
      CREATE POLICY "Admins manage tenant_configurations" ON public.tenant_configurations FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    END IF;
  END $$;
`);

await run('Enable vector extension', `CREATE EXTENSION IF NOT EXISTS vector;`);

await run('Create rag_embeddings', `
  CREATE TABLE IF NOT EXISTS public.rag_embeddings (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type text NOT NULL,
    source_id   text NOT NULL,
    content     text NOT NULL,
    embedding   vector(1536),
    metadata    jsonb DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(source_type, source_id)
  );
  ALTER TABLE public.rag_embeddings ENABLE ROW LEVEL SECURITY;
`);

await run('rag_embeddings RLS policy', `
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'rag_embeddings' AND policyname = 'Admins manage rag_embeddings'
    ) THEN
      CREATE POLICY "Admins manage rag_embeddings" ON public.rag_embeddings FOR ALL
        USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));
    END IF;
  END $$;
`);

console.log('\nDone.');
