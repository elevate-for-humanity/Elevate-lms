import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError, safeError } from '@/lib/api/safe-error';
import { upsertPage, upsertSections } from '@/lib/data/pages';
import { createClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/page-builder/pages/[id] — fetch one page with sections
export async function GET(request: NextRequest, { params }: Params) {
  const auth = await apiAuthGuard({ requireAuth: true, allowedRoles: ["admin", "super_admin"] });

  const { id } = await params;

  try {
    const supabase = await createClient();

    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !page) return safeError('Page not found', 404);

    const { data: sections } = await supabase
      .from('page_sections')
      .select('*')
      .eq('page_id', id)
      .order('position');

    return NextResponse.json({ ...page, sections: sections ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load page');
  }
}

// PUT /api/page-builder/pages/[id] — update page + replace sections
export async function PUT(request: NextRequest, { params }: Params) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({ requireAuth: true, allowedRoles: ["admin", "super_admin"] });

  const { id } = await params;

  try {
    const body = await request.json();
    const { slug, title, status, meta_title, meta_desc, sections = [] } = body;

    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

    // Verify page exists
    const supabase = await createClient();
    const { data: existing } = await supabase.from('pages').select('id').eq('id', id).single();
    if (!existing) return safeError('Page not found', 404);

    await upsertPage(slug, { title, status, meta_title, meta_desc });
    await upsertSections(id, sections);

    return NextResponse.json({ id });
  } catch (err) {
    return safeInternalError(err, 'Failed to update page');
  }
}

// DELETE /api/page-builder/pages/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({ requireAuth: true, allowedRoles: ["admin", "super_admin"] });

  const { id } = await params;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) return safeInternalError(error, 'Failed to delete page');
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return safeInternalError(err, 'Failed to delete page');
  }
}
