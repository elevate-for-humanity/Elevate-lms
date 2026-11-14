import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Compatibility endpoint for older clients. New verification uses secure
// document upload and authorized staff review.
export async function POST() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  return NextResponse.json({
    error: 'Automated verification is retired. Use secure document review.',
    url: '/onboarding/learner/verify-identity',
  }, { status: 410 });
}
