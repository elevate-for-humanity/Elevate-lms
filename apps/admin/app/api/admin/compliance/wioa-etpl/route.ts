import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();

    const { data: programs, error: programsError } = await db
      .from('programs')
      .select(
        'id, title, slug, etpl_listed, etpl_requires_initial_eligibility, intraining_program_id, is_active',
      )
      .order('title', { ascending: true });

    if (programsError) {
      logger.error('[wioa-etpl list] programs failed', programsError);
      return safeInternalError(programsError, 'Failed to list programs');
    }

    const { data: forms, error: formsError } = await db
      .from('program_wioa_compliance_forms')
      .select('program_id, form_type, status, completed_at');

    if (formsError) {
      logger.error('[wioa-etpl list] forms failed', formsError);
      return safeInternalError(formsError, 'Failed to list compliance forms');
    }

    const formMap = new Map<string, Record<string, { status: string; completed_at: string | null }>>();
    for (const row of forms ?? []) {
      const key = row.program_id;
      if (!formMap.has(key)) formMap.set(key, {});
      formMap.get(key)![row.form_type] = {
        status: row.status,
        completed_at: row.completed_at,
      };
    }

    const rows = (programs ?? []).map((p) => {
      const f = formMap.get(p.id) ?? {};
      const ieap = f.initial_eligibility_aggregate_performance;
      const s188 = f.section_188_checklist;
      const needsIeap = Boolean(p.etpl_requires_initial_eligibility);
      return {
        ...p,
        needs_ieap: needsIeap,
        ieap_status: needsIeap ? (ieap?.status ?? 'missing') : 'not_required',
        ieap_completed_at: ieap?.completed_at ?? null,
        section_188_status: s188?.status ?? 'missing',
        section_188_completed_at: s188?.completed_at ?? null,
        ready_for_etpl:
          (!needsIeap || ieap?.status === 'completed') && s188?.status === 'completed',
      };
    });

    return NextResponse.json({ programs: rows });
  } catch (err) {
    logger.error('[wioa-etpl list] error', err);
    return safeInternalError(err, 'Failed to load WIOA ETPL compliance overview');
  }
}
