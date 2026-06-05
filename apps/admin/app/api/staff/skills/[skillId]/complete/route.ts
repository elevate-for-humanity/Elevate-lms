import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { isStaffPortalApiAuth, requireStaffPortalApi } from '@/lib/api/staff-portal-guard';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest, { params }: { params: Promise<{ skillId: string }> }) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await requireStaffPortalApi();
  if (!isStaffPortalApiAuth(auth)) return auth;

  const db = await requireAdminClient();
  if (!db)
    return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });

  const { skillId } = await params;

  await db.from('user_skills').upsert(
    {
      user_id: auth.userId,
      skill_name: skillId,
      proficiency: 3,
      proficiency_level: 'competent',
      verified: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,skill_name' },
  );

  // Redirect back to skills page (form POST)
  return NextResponse.redirect(new URL('/admin/staff-portal/skills', req.url));
}

export const POST = withApiAudit('/api/staff/skills/[skillId]/complete', _POST);
