/**
 * Checks which recent migrations need to be applied by probing for the
 * tables/columns/functions each one creates.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || key === 'placeholder' || key.length < 30) {
  console.error(
    '❌ SUPABASE_SERVICE_ROLE_KEY missing or placeholder — cannot probe live DB.\n' +
      '   Set real keys in .env.local, then re-run: pnpm exec tsx scripts/check-pending-migrations.ts',
  );
  process.exit(1);
}

const db = createClient(url, key);

async function verifyConnection(): Promise<boolean> {
  const { error } = await db.from('programs').select('slug').limit(1);
  if (error?.message?.includes('Invalid API key') || error?.message?.includes('JWT')) {
    return false;
  }
  return true;
}

async function tableExists(name: string): Promise<boolean> {
  const { error } = await db.from(name as any).select('*').limit(0);
  if (!error) return true;
  if (error.message.includes('does not exist')) return false;
  if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
    throw new Error('Invalid Supabase API key — probes would be unreliable');
  }
  // Permission errors still mean the relation exists
  return true;
}

async function columnExists(table: string, col: string): Promise<boolean> {
  const { data } = await db
    .from('information_schema.columns' as any)
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', table)
    .eq('column_name', col)
    .maybeSingle();
  return !!data;
}

// Probe each recent migration by its key artifact
const checks: Array<{ file: string; check: () => Promise<boolean>; description: string }> = [
  {
    file: '20260701000001_fix_completion_trigger_table_split.sql',
    check: () => tableExists('program_completion_certificates'),
    description: 'program_completion_certificates table',
  },
  {
    file: '20260701000002_stale_application_archive.sql',
    check: () => tableExists('archived_applications'),
    description: 'archived_applications table',
  },
  {
    file: '20260701000003_program_integrity_view.sql',
    check: async () => {
      const { error } = await db.from('program_integrity_report' as any).select('*').limit(0);
      return !error || !error.message.includes('does not exist');
    },
    description: 'program_integrity_report view',
  },
  {
    file: '20260701000004_fix_missing_views.sql',
    check: () => tableExists('lms_lessons'),
    description: 'lms_lessons view',
  },
  {
    file: '20260701000005_devstudio_rpc_and_rag.sql',
    check: () => tableExists('rag_documents'),
    description: 'rag_documents table',
  },
  {
    file: '20260701000006_curriculum_uploads.sql',
    check: () => tableExists('curriculum_uploads'),
    description: 'curriculum_uploads table',
  },
  {
    file: '20260701000007_document_intel_and_grant_applications.sql',
    check: () => tableExists('document_intel_results'),
    description: 'document_intel_results table',
  },
  {
    file: '20260701000008_contract_automation.sql',
    check: () => tableExists('contract_templates'),
    description: 'contract_templates table',
  },
  {
    file: '20260701000009_fix_program_holders_user_id_constraint.sql',
    // Drops duplicate constraint unique_program_holders_user_id (column already exists).
    check: () => tableExists('program_holders'),
    description: 'program_holders table (constraint fix migration)',
  },
  {
    file: '20260701000010_platform_secrets.sql',
    check: () => tableExists('platform_secrets'),
    description: 'platform_secrets table',
  },
  {
    file: '20260701000011_bootstrap_missing_profiles.sql',
    check: async () => {
      const { data } = await db
        .from('profiles')
        .select('role')
        .eq('email', 'curvaturebodysculpting@gmail.com')
        .maybeSingle();
      return data?.role === 'admin';
    },
    description: 'curvaturebodysculpting@gmail.com has admin role',
  },
];

if (!(await verifyConnection())) {
  console.error('❌ Supabase auth failed — fix SUPABASE_SERVICE_ROLE_KEY before probing migrations.');
  process.exit(1);
}

console.log('Checking recent migrations...\n');
const pending: string[] = [];
for (const c of checks) {
  const applied = await c.check();
  const status = applied ? '✅ applied' : '❌ PENDING';
  console.log(`${status}  ${c.file}`);
  console.log(`           → ${c.description}`);
  if (!applied) pending.push(c.file);
}

console.log('\n' + (pending.length === 0
  ? 'All checked migrations are applied.'
  : `PENDING (${pending.length}):\n` + pending.map(f => '  ' + f).join('\n')));
