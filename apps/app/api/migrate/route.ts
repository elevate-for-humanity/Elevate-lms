import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260711000001_curriculum_licensing_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const { data, error } = await supabase.rpc('pg_execute', {
    sql_query: sql
  }).catch(() => ({ data: null, error: { message: 'RPC not available' } }));

  return NextResponse.json({ 
    ok: true, 
    message: 'Use Supabase Dashboard SQL Editor',
    rpcError: error?.message 
  });
}
