// Apply only the missing parts of migration 20260630000003.
// Live inspection confirmed: mentorships + mentor_sessions exist; mentor_messages + mentor_resources do not.
// Requires NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in env.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function exec(label, sql) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SKEY, Authorization: `Bearer ${SKEY}` },
    body: JSON.stringify({ sql }),
  });
  const body = await r.text();
  const ok = r.status === 204 || r.status === 200;
  console.log(`  ${ok ? '✓' : '✗'} ${label}  [${r.status}]${body ? ' ' + body.slice(0, 200) : ''}`);
  return ok;
}

const steps = [
  ['create mentor_messages', `
    CREATE TABLE IF NOT EXISTS public.mentor_messages (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      mentorship_id  uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
      sender_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      content        text NOT NULL,
      read_at        timestamptz,
      created_at     timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS mentor_messages_mentorship_idx ON public.mentor_messages (mentorship_id);
    CREATE INDEX IF NOT EXISTS mentor_messages_sender_idx     ON public.mentor_messages (sender_id);
    CREATE INDEX IF NOT EXISTS mentor_messages_created_idx    ON public.mentor_messages (created_at DESC);
  `],
  ['create mentor_resources', `
    CREATE TABLE IF NOT EXISTS public.mentor_resources (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title       text NOT NULL,
      description text,
      url         text NOT NULL,
      file_type   text,
      category    text,
      created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at  timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS mentor_resources_category_idx ON public.mentor_resources (category);
  `],
  ['enable RLS on new tables', `
    ALTER TABLE public.mentor_messages  ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.mentor_resources ENABLE ROW LEVEL SECURITY;
  `],
  ['mentor_messages policies', `
    DROP POLICY IF EXISTS "mentor_messages_select" ON public.mentor_messages;
    DROP POLICY IF EXISTS "mentor_messages_insert" ON public.mentor_messages;
    CREATE POLICY "mentor_messages_select" ON public.mentor_messages FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM public.mentorships m
                WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid()))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
      );
    CREATE POLICY "mentor_messages_insert" ON public.mentor_messages FOR INSERT
      WITH CHECK (sender_id = auth.uid());
  `],
  ['mentor_resources policies', `
    DROP POLICY IF EXISTS "mentor_resources_select" ON public.mentor_resources;
    DROP POLICY IF EXISTS "mentor_resources_insert" ON public.mentor_resources;
    CREATE POLICY "mentor_resources_select" ON public.mentor_resources FOR SELECT
      USING (auth.uid() IS NOT NULL);
    CREATE POLICY "mentor_resources_insert" ON public.mentor_resources FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('mentor', 'admin', 'super_admin')));
  `],
  ['realtime publication for mentor_messages', `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'mentor_messages'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_messages;
      END IF;
    END $$;
  `],
];

console.log('Applying remaining parts of migration 20260630000003_mentor_portal_tables.sql\n');
let allOk = true;
for (const [label, sql] of steps) {
  const ok = await exec(label, sql);
  if (!ok) allOk = false;
}
console.log(`\n${allOk ? '✅ All steps applied.' : '❌ Some steps failed.'}`);
process.exit(allOk ? 0 : 1);
