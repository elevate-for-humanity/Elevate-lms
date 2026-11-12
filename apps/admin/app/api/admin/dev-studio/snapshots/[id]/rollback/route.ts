import type { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { POST as rollbackSnapshot } from '../../../snapshot/[id]/rollback/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Plural alias of ../../../snapshot/[id]/rollback (service-role rollback_sql + rolled_back_at).
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  return rollbackSnapshot(req, context);
}
