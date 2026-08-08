import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { loadAllBlueprints } from '@/lib/course-factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const id = req.nextUrl.searchParams.get('id');
  const registry = await loadAllBlueprints();
  if (!id) {
    return NextResponse.json({ blueprints: registry.map((b) => ({
      id: b.id,
      title: b.credentialTitle,
      credentialCode: b.credentialCode,
      state: b.state,
      slug: b.programSlug,
      modules: b.modules.length,
      lessons: b.modules.reduce((sum, mod) => sum + (mod.lessons?.length ?? 0), 0),
      status: b.status,
      socCode: b.socCode ?? null,
    })) });
  }

  const blueprint = registry.find((b) => b.id === id);
  if (!blueprint) return safeError('Blueprint not found', 404);
  return NextResponse.json({ blueprint });
}
