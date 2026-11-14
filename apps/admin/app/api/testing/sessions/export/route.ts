import { NextResponse } from 'next/server';
import { requireApiRole } from '@/lib/auth/require-api-role';
import { csvCell } from '@/lib/testing/native-exam-policy';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const auth = await requireApiRole(['admin', 'super_admin', 'staff', 'test_admin', 'proctor']);
  if (auth instanceof NextResponse) return auth;
  const params = new URL(request.url).searchParams;
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    let query = auth.db
      .from('exam_sessions')
      .select(
        'id,created_at,student_name,student_email,provider,exam_name,delivery_method,id_verified,status,result,score,proctor_name,is_retest,proctor_notes',
      )
      .order('created_at')
      .order('id')
      .range(offset, offset + 499);
    for (const key of ['provider', 'result', 'review_status'])
      if (params.get(key)) query = query.eq(key, params.get(key));
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: 'Complete export unavailable' }, { status: 503 });
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  const headers = [
    'Date',
    'Student',
    'Email',
    'Provider',
    'Exam',
    'Delivery',
    'ID Verified',
    'Status',
    'Result',
    'Score',
    'Proctor',
    'Retest',
    'Notes',
  ];
  const values = rows.map((s) => [
    s.created_at,
    s.student_name,
    s.student_email,
    s.provider,
    s.exam_name,
    s.delivery_method,
    s.id_verified,
    s.status,
    s.result,
    s.score,
    s.proctor_name,
    s.is_retest,
    s.proctor_notes,
  ]);
  return new Response([headers, ...values].map((row) => row.map(csvCell).join(',')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="exam-sessions.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
