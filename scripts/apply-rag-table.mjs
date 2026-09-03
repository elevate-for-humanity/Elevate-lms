const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SKEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SKEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function run(label, sql) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': `Bearer ${SKEY}` },
    body: JSON.stringify({ sql }),
  });
  const body = await r.text();
  console.log(r.ok ? '✓' : '✗', label, r.ok ? '' : '-> ' + body.slice(0, 150));
}

// rag_embeddings without vector type (pgvector needs superuser to enable)
// embedding stored as jsonb float array until vector extension is enabled via Dashboard
await run('Create rag_embeddings', `
  CREATE TABLE IF NOT EXISTS public.rag_embeddings (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type text NOT NULL,
    source_id   text NOT NULL,
    content     text NOT NULL,
    embedding   jsonb,
    metadata    jsonb DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE(source_type, source_id)
  );
  ALTER TABLE public.rag_embeddings ENABLE ROW LEVEL SECURITY;
`);

await run('rag_embeddings RLS policy', `
  DO $body$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE tablename = 'rag_embeddings'
        AND policyname = 'Admins manage rag_embeddings'
    ) THEN
      CREATE POLICY "Admins manage rag_embeddings"
        ON public.rag_embeddings FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
              AND role IN ('admin', 'super_admin')
          )
        );
    END IF;
  END
  $body$;
`);

console.log('Done.');
