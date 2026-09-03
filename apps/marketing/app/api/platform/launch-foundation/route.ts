import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { createLaunchFoundation } from '@/lib/platform/launch-foundation';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const tenantId = await resolveTenantIdForUser(user.id);
  if (!tenantId) {
    return NextResponse.json({ error: 'A workspace is required before generating a launch foundation.' }, { status: 409 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .maybeSingle();

  const body = await request.json().catch(() => ({}));
  const businessName = text(body.businessName, 100);
  const industry = text(body.industry, 100);
  const audience = text(body.audience, 240);
  const offer = text(body.offer, 240);
  const transformation = text(body.transformation, 500);
  const style = text(body.style, 80) || 'professional';

  if (!businessName || !industry || !audience || !offer || !transformation) {
    return NextResponse.json({
      error: 'businessName, industry, audience, offer, and transformation are required.',
    }, { status: 400 });
  }

  try {
    const result = await createLaunchFoundation({
      tenantId,
      userId: user.id,
      organizationId: profile?.organization_id ?? null,
      businessName,
      industry,
      audience,
      offer,
      transformation,
      style,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[launch-foundation] generation failed', error);
    return NextResponse.json({ error: 'Could not generate the launch foundation.' }, { status: 500 });
  }
}
