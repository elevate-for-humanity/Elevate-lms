// PUBLIC ROUTE: returns approved host shops for program selection dropdowns and the host-shops page.
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';
import { getApprovedShops, type ProgramKey } from '@/lib/programs/host-shops';
import { safeInternalError } from '@/lib/api/safe-error';

export const revalidate = 300;

export type { HostShop } from '@/lib/programs/host-shops';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  try {
    const program = new URL(request.url).searchParams.get('program') as ProgramKey | null;
    const shops = await getApprovedShops(program ?? undefined);
    return NextResponse.json({ shops });
  } catch (err) {
    return safeInternalError(err, 'Failed to load host shops');
  }
}
