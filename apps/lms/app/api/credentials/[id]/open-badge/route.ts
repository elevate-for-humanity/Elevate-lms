import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth-guard';
import { requireRoleAPI } from '@/lib/rbac-guard';
import { issueNativeOpenBadge } from '@/lib/credentials/native-issuer';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const session = await requireAuthAPI();
  if (session instanceof Response) return session;

  const roleCheck = requireRoleAPI(session, ['admin', 'super_admin', 'org_admin', 'staff']);
  if (roleCheck instanceof Response) return roleCheck;

  const { id } = await params;
  const result = await issueNativeOpenBadge(id);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json(result);
}

export const POST = withApiAudit('/api/credentials/[id]/open-badge', _POST);
