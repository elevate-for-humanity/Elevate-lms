export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { remediateMissingApplicationDocuments } from '@/lib/automation/application-document-remediation';
import { requireAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  applicationId: z.string().uuid(),
  triggerType: z.string().trim().min(1).max(80).default('admin_reconciliation'),
});

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Invalid remediation request.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const db = await requireAdminClient();
    const result = await remediateMissingApplicationDocuments(
      db,
      parsed.data.applicationId,
      parsed.data.triggerType,
    );
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return safeInternalError(error, 'Application remediation failed');
  }
}
