import { NextResponse } from 'next/server';
import { safeError } from '@/lib/api/safe-error';

export function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === '42703' ||
    error.code === 'PGRST205' ||
    error.code === 'PGRST204' ||
    (error.message?.includes('relation') && error.message.includes('does not exist')) === true ||
    (error.message?.includes('column') && error.message.includes('does not exist')) === true
  );
}

export function tableNotReadyResponse() {
  return safeError(
    'Dev Studio OS tables need schema update. Apply migration 20260808000002_dev_studio_schema_reconcile.sql in Supabase Dashboard.',
    503,
  );
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
