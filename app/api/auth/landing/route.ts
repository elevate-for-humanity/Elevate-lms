import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { resolveAuthenticatedLandingDestination } from '@/lib/auth/landing-destination';
import { readRedirectParam, validateRedirect } from '@/lib/auth/validate-redirect';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated', redirectTo: '/login' },
        { status: 401 },
      );
    }

    const explicitRedirect = validateRedirect(readRedirectParam(request.nextUrl.searchParams), '');
    const landing = await resolveAuthenticatedLandingDestination(supabase, user);
    return NextResponse.json({
      ...landing,
      redirectTo: explicitRedirect || landing.redirectTo,
    });
  } catch (error) {
    logger.error('Auth landing error:', error);
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/auth/landing', _GET);
