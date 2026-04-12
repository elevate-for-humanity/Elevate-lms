import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/documents/templates?type=mou|report
 * Returns the latest saved template of the given type.
 * Admin-only.
 */
async function _GET(request: NextRequest) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const type = request.nextUrl.searchParams.get('type') || 'mou';

  const { data, error } = await db
    .from('mou_templates')
    .select('id, name, title, content, version, is_active, created_at, updated_at')
    .eq('name', type)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ template: null });
  }

  return NextResponse.json({ template: data });
}

/**
 * POST /api/admin/documents/templates
 * Upserts a template. Body: { type: 'mou'|'report', title, content }
 * Deactivates prior versions of the same type before inserting new one.
 * Admin-only.
 */
async function _POST(request: NextRequest) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'Admin client failed to initialize' }, { status: 500 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!['admin', 'super_admin'].includes(profile?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { type, title, content } = body;

  if (!type || !content) {
    return NextResponse.json({ error: 'type and content are required' }, { status: 400 });
  }

  if (!['mou', 'report'].includes(type)) {
    return NextResponse.json({ error: 'type must be mou or report' }, { status: 400 });
  }

  // Deactivate existing active templates of this type
  await db
    .from('mou_templates')
    .update({ is_active: false })
    .eq('name', type)
    .eq('is_active', true);

  // Derive next version number
  const { data: latest } = await db
    .from('mou_templates')
    .select('version')
    .eq('name', type)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevVersion = parseFloat(latest?.version || '0');
  const nextVersion = (Math.round((prevVersion + 0.1) * 10) / 10).toFixed(1);

  const { data: inserted, error } = await db
    .from('mou_templates')
    .insert({
      name: type,
      title: title || (type === 'mou' ? 'MOU Template' : 'Report Template'),
      content,
      version: nextVersion,
      is_active: true,
    })
    .select('id, version')
    .single();

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: inserted.id, version: inserted.version });
}

export const GET = withApiAudit('/api/admin/documents/templates', _GET);
export const POST = withApiAudit('/api/admin/documents/templates', _POST);
