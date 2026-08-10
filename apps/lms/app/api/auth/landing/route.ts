// app/api/auth/landing/route.ts
import { NextResponse } from 'next/server';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getRoleDestinationUrl } from '@/lib/auth/role-destinations';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            logger.error(
              'Error setting cookie',
              normalizeError(error, 'Failed to set cookie'),
              getErrorContext(error),
            );
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            logger.error(
              'Error removing cookie',
              normalizeError(error, 'Failed to remove cookie'),
              getErrorContext(error),
            );
          }
        },
      },
    },
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ redirectTo: '/login' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !profile) {
      logger.error(
        'Error fetching profile',
        normalizeError(error, 'Failed to fetch profile'),
        getErrorContext(error),
      );
      return NextResponse.json({ redirectTo: '/login' });
    }

    // The LMS login can authenticate users whose dashboard belongs to Admin
    // or Marketing. Return the full owning-host URL, never a relative path.
    const redirectTo = getRoleDestinationUrl(profile.role as string);
    return NextResponse.json({ redirectTo });
  } catch (error) {
    logger.error(
      'Auth landing error',
      normalizeError(error, 'Authentication error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
  }
}

export const GET = withApiAudit('/api/auth/landing', _GET);
