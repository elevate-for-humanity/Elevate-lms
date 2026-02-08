export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/payroll/export/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toError, toErrorMessage } from '@/lib/safe';

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodStart = searchParams.get('start');
  const periodEnd = searchParams.get('end');

  if (!periodStart || !periodEnd) {
    return NextResponse.json(
      { error: 'start and end dates required' },
      { status: 400 }
    );
  }

  // Fetch time entries for the period
  const { data: entries, error } = await supabase
    .from('time_entries')
    .select(
      `
      *,
      profiles:user_id (
        id,
        full_name,
        email,
        external_payroll_id
      )
    `
    )
    .gte('worked_at', periodStart)
    .lte('worked_at', periodEnd);

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  const header = ['EmployeeId', 'Name', 'Date', 'Hours', 'PayCode'];

  const rows = (entries || []).map((e: Record<string, any>) => [
    e.profiles?.external_payroll_id ?? e.profiles?.id ?? '',
    e.profiles?.full_name ?? e.profiles?.email ?? '',
    new Date(e.worked_at).toISOString().slice(0, 10),
    e.hours?.toString() ?? '0',
    'REG', // or OVERTIME based on your logic
  ]);

  const csv = [header, ...rows]
    .map((r) =>
      r.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payroll-${periodStart}-to-${periodEnd}.csv"`,
    },
  });
}
