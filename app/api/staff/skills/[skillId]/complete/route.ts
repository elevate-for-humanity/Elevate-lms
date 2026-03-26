
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest, { params }: { params: Promise<{ skillId: string }> }) {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { skillId } = await params;

  await db.from('user_skills').upsert({
    user_id: user.id,
    skill_name: skillId,
    proficiency: 3,
    proficiency_level: 'competent',
    verified: false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,skill_name' });

  // Redirect back to skills page (form POST)
  return NextResponse.redirect(new URL('/staff-portal/skills', req.url));
}

export const POST = withApiAudit('/api/staff/skills/[skillId]/complete', _POST);
