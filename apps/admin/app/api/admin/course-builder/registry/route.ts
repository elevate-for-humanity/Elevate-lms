import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  toCredentialRegistryCsv,
  validateCredentialRegistryRecord,
  type CredentialRegistryRecord,
} from '@/lib/course-builder/credential-registry';
import { requireAdminClient } from '@/lib/supabase/admin';
import { registryFacts } from '@/lib/course-builder/registry-facts';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;
  const id = request.nextUrl.searchParams.get('courseId');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return safeError('A course ID is required', 400);
  try {
    const db = await requireAdminClient();
    const {data: course, error} = await db.from('courses').select('id,title,description,short_description,program_id,duration_hours,duration_weeks,tuition_cost,prerequisites,learning_outcomes,metadata').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!course) return safeError('Course not found', 404);
    let program = {};
    if (course.program_id) {
      const result = await db.from('programs').select('delivery_method,delivery_mode,prerequisites,what_you_learn,career_outcomes,funding_tags,funding_pathways,lms_config').eq('id', course.program_id).maybeSingle();
      if (result.error) throw result.error;
      program = result.data || {};
    }
    return NextResponse.json({ok: true, facts: registryFacts(course, program)}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    return safeInternalError(error, 'Unable to retrieve supplied credential facts');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => null);
    if (!body?.record) return safeError('Credential Registry record is required', 400);

    const record = body.record as CredentialRegistryRecord;
    const validation = validateCredentialRegistryRecord(record);

    if (body.action === 'validate') {
      return NextResponse.json({ ok: true, validation });
    }

    if (body.action === 'export') {
      const csv = toCredentialRegistryCsv([record]);
      const slug = record.credentialName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'credential';
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${slug}-credential-registry.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return safeError('Unknown action', 400);
  } catch (error) {
    return safeInternalError(error, 'Credential Registry preparation failed');
  }
}
