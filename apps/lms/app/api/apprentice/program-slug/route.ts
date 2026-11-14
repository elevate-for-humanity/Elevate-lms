import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';

export const dynamic = 'force-dynamic';

/**
 * GET /api/apprentice/program-slug
 * Returns the authenticated user's active apprenticeship program slug.
 * Used by DocumentsClient and other pages that previously hardcoded 'barber-apprenticeship'.
 */
export async function GET(_req: NextRequest) {
  const rateLimited = await applyRateLimit(_req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  return NextResponse.json({ programSlug }, { headers: { 'Cache-Control': 'private, no-store' } });
}
