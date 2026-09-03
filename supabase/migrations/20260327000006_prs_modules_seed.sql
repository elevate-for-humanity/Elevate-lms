-- PRS modules seed + curriculum_lessons alignment
--
-- Inserts 8 rows into public.modules for the PRS program, then aligns
-- curriculum_lessons.module_id to those rows.
--
-- Depends on:
--   - programs row with slug = 'peer-recovery-specialist-jri' (seeded earlier)
--   - modules.slug column (added by 20260322000000_schema_repair_pre_migration.sql)
--   - curriculum_lessons rows for PRS (seeded by seed-prs-curriculum.ts script)
--
-- Apply manually via Supabase Dashboard SQL Editor.
--
-- Verification queries (run after applying):
--   SELECT slug, title, order_index FROM modules
--   WHERE program_id = (SELECT id FROM programs WHERE slug = 'peer-recovery-specialist-jri')
--   ORDER BY order_index;
--   -- Expected: 8 rows, slugs peer-mod-1 through peer-mod-8
--
--   SELECT COUNT(*) FROM curriculum_lessons
--   WHERE program_id = (SELECT id FROM programs WHERE slug = 'peer-recovery-specialist-jri')
--     AND module_id IS NOT NULL;
--   -- Expected: matches total PRS lesson count (39)

BEGIN;

-- ─── 1. Resolve PRS program_id ────────────────────────────────────────────────

DO $$
DECLARE
  v_program_id uuid;
BEGIN
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = 'peer-recovery-specialist-jri'
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'PRS program not found (slug = peer-recovery-specialist-jri). Run program seed first.';
  END IF;

  -- ─── 2. Insert 8 PRS modules (idempotent via ON CONFLICT) ──────────────────

  INSERT INTO public.modules (program_id, slug, title, summary, order_index)
  VALUES
    (v_program_id, 'peer-mod-1', 'Introduction to Peer Recovery',
     'Understand the peer recovery specialist role, recovery-oriented principles, and professional boundaries.',
     1),
    (v_program_id, 'peer-mod-2', 'Ethics and Professional Conduct',
     'Apply the code of ethics, confidentiality rules, and ethical decision-making frameworks.',
     2),
    (v_program_id, 'peer-mod-3', 'Recovery and Wellness',
     'Compare recovery models, stages of change, wellness dimensions, and relapse prevention.',
     3),
    (v_program_id, 'peer-mod-4', 'Peer Support Skills',
     'Practice active listening, motivational interviewing, self-disclosure, and rapport-building.',
     4),
    (v_program_id, 'peer-mod-5', 'Advocacy and Empowerment',
     'Build client self-advocacy capacity, navigate systems advocacy, and uphold participant rights.',
     5),
    (v_program_id, 'peer-mod-6', 'Resource Navigation and Linkage',
     'Map community resources, execute warm handoffs, and remove barriers to service access.',
     6),
    (v_program_id, 'peer-mod-7', 'Crisis Support and Safety',
     'Recognize crisis, apply de-escalation, respond to suicidal ideation, and fulfill mandatory reporting.',
     7),
    (v_program_id, 'peer-mod-8', 'Field Practicum and Certification Prep',
     'Complete practicum hours, review all domains, and prepare for the CPRS certification exam.',
     8)
  ON CONFLICT (program_id, slug) DO UPDATE SET
    title       = EXCLUDED.title,
    summary     = EXCLUDED.summary,
    order_index = EXCLUDED.order_index,
    updated_at  = now();

  -- ─── 3. Align curriculum_lessons.module_id ─────────────────────────────────
  -- Joins on slug pattern: peer-mod-N matches module_order N-1
  -- (module_order is 0-indexed in curriculum_lessons; order_index is 1-indexed in modules)

  UPDATE public.curriculum_lessons cl
  SET module_id = m.id
  FROM public.modules m
  WHERE m.program_id = v_program_id
    AND m.slug = 'peer-mod-' || (cl.module_order + 1)::text
    AND cl.program_id = v_program_id;

  RAISE NOTICE 'PRS modules seeded and curriculum_lessons aligned for program_id = %', v_program_id;
END $$;

-- ─── 4. Verify alignment ──────────────────────────────────────────────────────
-- This SELECT will appear in the migration output log.
-- Rows with module_id IS NULL after this migration indicate lessons that were
-- not yet seeded into curriculum_lessons (run seed-prs-curriculum.ts first).

DO $$
DECLARE
  v_program_id   uuid;
  v_total        integer;
  v_aligned      integer;
  v_unaligned    integer;
BEGIN
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = 'peer-recovery-specialist-jri'
  LIMIT 1;

  SELECT COUNT(*) INTO v_total
  FROM public.curriculum_lessons
  WHERE program_id = v_program_id;

  SELECT COUNT(*) INTO v_aligned
  FROM public.curriculum_lessons
  WHERE program_id = v_program_id AND module_id IS NOT NULL;

  v_unaligned := v_total - v_aligned;

  RAISE NOTICE 'PRS curriculum_lessons: total=%, aligned=%, unaligned=%',
    v_total, v_aligned, v_unaligned;

  IF v_unaligned > 0 THEN
    RAISE WARNING '% PRS lessons have no module_id. Run scripts/seed-prs-curriculum.ts first, then re-run this migration.',
      v_unaligned;
  END IF;
END $$;

COMMIT;
