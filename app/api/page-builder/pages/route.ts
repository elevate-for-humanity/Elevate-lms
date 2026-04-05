import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { getAllPages, upsertPage, upsertSections } from '@/lib/data/pages';

// GET /api/page-builder/pages — list all pages
export async function GET(request: NextRequest) {
  const auth = await apiAuthGuard({ requireAuth: true, allowedRoles: ['admin', 'super_admin'] });

  try {
    const pages = await getAllPages();
    return NextResponse.json(pages);
  } catch (err) {
    return safeInternalError(err, 'Failed to load pages');
  }
}

// POST /api/page-builder/pages — create a new page
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({ requireAuth: true, allowedRoles: ['admin', 'super_admin'] });

  try {
    const body = await request.json();
    const { slug, title, status, meta_title, meta_desc, sections = [] } = body;

    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 });

    const id = await upsertPage(slug, { title, status, meta_title, meta_desc });
    await upsertSections(id, sections);

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create page');
  }
}
