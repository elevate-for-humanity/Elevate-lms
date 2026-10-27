import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Compatibility response for bookmarks and old admin clients. Course costs and
// payer rules are maintained by the active program external-course editor.
export async function POST(req: NextRequest) {
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;
  return NextResponse.json(
    { error: 'This product sync is retired. Set the cost and payer rule in the program manager.' },
    { status: 410 },
  );
}
