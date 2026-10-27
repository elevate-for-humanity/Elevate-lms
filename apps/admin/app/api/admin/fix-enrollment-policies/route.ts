import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/with-auth';
import { writeApiAuditEvent } from '@/lib/audit/api-audit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

export const POST = withAuth(
  async (req: NextRequest, ctx) => {
    const auditBase = {
      endpoint: '/api/admin/fix-enrollment-policies',
      method: 'POST',
      actor_type: 'user' as const,
      actor_id: ctx?.user?.id ?? null,
    };
    await writeApiAuditEvent({ ...auditBase, result: 'denied', status_code: 410 });
    return NextResponse.json(
      {
        error: 'Enrollment policies are migration-managed and cannot be changed at runtime.',
      },
      { status: 410 },
    );
  },
  { roles: ['admin'] },
);
