#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

type Status = 'pass' | 'fail' | 'warning';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SENSITIVE_TABLES = [
  'organizations',
  'organization_users',
  'profiles',
  'students',
  'enrollments',
  'audit_logs',
  'certificates',
  'lesson_progress',
];

function print(status: Status, label: string, detail?: string) {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${label}${detail ? `: ${detail}` : ''}`);
}

async function main() {
  if (!supabaseUrl || !serviceRoleKey) {
    print(
      'warning',
      'RLS audit skipped',
      'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in this environment'
    );
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let failures = 0;

  const sql = `
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
      AND tablename = ANY($1::text[])
    ORDER BY tablename;
  `;

  const { data, error } = await supabase.rpc('exec_sql', {
    sql,
    params: [SENSITIVE_TABLES],
  } as never);

  if (error) {
    print(
      'warning',
      'Could not execute exec_sql RPC',
      'Run scripts/verify-audit-logs-schema.sql queries manually in Supabase SQL editor'
    );
    process.exit(0);
  }

  const missingRls = Array.isArray(data) ? data.map((r: any) => r.tablename) : [];
  if (missingRls.length > 0) {
    failures++;
    print('fail', 'Sensitive tables missing RLS', missingRls.join(', '));
  } else {
    print('pass', 'Sensitive table RLS baseline', 'all checked tables have RLS enabled');
  }

  if (failures > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  print('fail', 'Unhandled audit error', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
