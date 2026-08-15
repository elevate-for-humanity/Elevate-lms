import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20260711000001_curriculum_licensing_tables.sql',
  );
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  let rpcError: string | undefined;
  try {
    const { error } = await supabase.rpc('pg_execute', { sql_query: sql });
    rpcError = error?.message;
  } catch {
    rpcError = 'RPC not available';
  }

  return NextResponse.json({
    ok: true,
    message: 'Use Supabase Dashboard SQL Editor',
    rpcError,
  });
}
