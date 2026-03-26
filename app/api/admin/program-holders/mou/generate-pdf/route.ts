import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guardAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// MOU PDF generation moved to reduce bundle size
async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json(
    { error: 'PDF generation temporarily unavailable' },
    { status: 503 }
  );
}

async function _POST(request: Request) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const denied = await guardAdmin();
  if (denied) return denied;
  return NextResponse.json(
    { error: 'PDF generation temporarily unavailable' },
    { status: 503 }
  );
}
export const GET = withApiAudit('/api/admin/program-holders/mou/generate-pdf', _GET);
export const POST = withApiAudit('/api/admin/program-holders/mou/generate-pdf', _POST);
