import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireCurrentHostShopPartner } from '@/lib/partners/current-host-shop';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function matchesProgram(value: string | null, requested: string | null) {
  if (!requested) return true;
  const normalize = (input: string | null) =>
    String(input || '')
      .toLowerCase()
      .replace(/-apprenticeship$/, '');
  return normalize(value) === normalize(requested);
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const { user } = await requireCurrentHostShopPartner();
    const board = await getHostShopBoard(user.id);
    const requestedProgram = request.nextUrl.searchParams.get('program');
    const apprentices = board.apprentices
      .filter((item) => matchesProgram(item.program_slug, requestedProgram))
      .map((item) => ({
        id: item.student_id,
        placement_id: item.id,
        full_name: item.name,
        email: item.email,
        avatar_url: null,
        start_date: item.start_date,
        total_hours: item.ojt.completed,
        competency_progress: item.competency,
      }));
    return NextResponse.json({ apprentices });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    return NextResponse.json(
      { error: 'No active Host Shop context' },
      { status: code === 'HOST_SHOP_UNAUTHENTICATED' ? 401 : 403 },
    );
  }
}

export const GET = withApiAudit('/api/partner/apprentices', _GET);
