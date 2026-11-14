import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

type ScanRead = { data: Record<string, unknown>[] | null; count: number | null; error: unknown };
async function category(query: PromiseLike<ScanRead>) {
  try {
    const result = await query;
    if (result.error) throw result.error;
    return { status: 'checked', issues: result.data ?? [], count: result.count ?? result.data?.length ?? 0 };
  } catch (error) {
    logger.error('[ops-scan] source unavailable', error);
    return { status: 'unavailable', issues: [], count: null };
  }
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = await requireAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stale = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [enrollments, documents, payments, login, payroll, onboarding] = await Promise.all([
      category(db.from('program_enrollments').select('id,student_id:user_id,program_id,status,created_at', { count: 'exact' }).in('status', ['pending', 'unassigned']).order('created_at', { ascending: false }).limit(50)),
      category(db.from('documents').select('id,student_id:user_id,status,document_type', { count: 'exact' }).in('status', ['pending', 'submitted', 'under_review']).limit(50)),
      category(db.from('payments').select('id,student_id:user_id,amount,status,created_at', { count: 'exact' }).eq('status', 'failed').limit(50)),
      category(db.from('failed_login_attempts').select('id,issue_type:reason,created_at', { count: 'exact' }).gte('created_at', since).order('created_at', { ascending: false }).limit(50)),
      category(db.from('payroll_runs').select('id,status,pay_period_start,pay_period_end', { count: 'exact' }).eq('status', 'failed').limit(50)),
      category(db.from('onboarding_progress').select('id,user_id,current_step,updated_at', { count: 'exact' }).eq('is_complete', false).lt('updated_at', stale).limit(50)),
    ]);
    const results = [enrollments, documents, payments, login, payroll, onboarding];
    const complete = results.every(result => result.status === 'checked');
    const total = results.reduce((sum, result) => sum + (result.count ?? 0), 0);
    return NextResponse.json({
      status: complete ? 'completed' : 'partial',
      scan: { timestamp: new Date().toISOString(), enrollments, documents, payments, login, payroll, onboarding, total, complete },
      summary: complete ? `Found ${total} issues across all categories` : 'Some operational sources could not be checked',
    }, { status: complete ? 200 : 503, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    logger.error('[ops-scan] failed', error);
    return NextResponse.json({ error: 'Operational scan unavailable' }, { status: 503 });
  }
}
