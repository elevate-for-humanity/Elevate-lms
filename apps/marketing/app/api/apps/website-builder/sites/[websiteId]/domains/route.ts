/**
 * GET /api/apps/website-builder/sites/[websiteId]/domains
 * Lists all domains attached to a website (owned by the authenticated user).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { isDomaineeConfigured } from '@/lib/domainee/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  await hydrateProcessEnv().catch(() => {});
  const { websiteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id)
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { data: domains, error } = await supabase
    .from('website_domains')
    .select('*')
    .eq('website_id', websiteId)
    .eq('user_id', user.id)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    domains: domains ?? [],
    configured: isDomaineeConfigured(),
  });
}
