// Returns the current authenticated user for client-side session checks.
// Called by ApprenticeHome PWA component to gate dashboard data fetching.
// Returns { user } if authenticated, { user: null } if not — never 401,
// so the caller can branch without error handling.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  // Return minimal safe fields — no sensitive data
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
