import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  toCredentialRegistryCsv,
  validateCredentialRegistryRecord,
  type CredentialRegistryRecord,
} from '@/lib/course-builder/credential-registry';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      if (!validation.ready) {
        return NextResponse.json(
          { ok: false, error: 'Registry record is incomplete', validation },
          { status: 422 },
        );
      }
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
