/**
 * GET /api/auth/session
 * Returns current user session info
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(name, value, options) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignore errors in read-only contexts
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null, session: null }, { status: 401 });
  }

  return NextResponse.json({
    user,
    session: { expires_at: user.app_metadata?.exp },
    service: process.env.SERVICE_NAME ?? 'admin'
  });
}
