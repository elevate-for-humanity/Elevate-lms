export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/auth/landing/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { logger } from '@/lib/logger';

export async function GET() {
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
          } catch (error) { /* Error handled silently */ 
            // Handle cookie setting errors
            logger.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) { /* Error handled silently */ 
            // Handle cookie removal errors
            logger.error('Error removing cookie:', error);
          }
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ redirectTo: '/auth/login' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      logger.error('Error fetching profile:', error);
      return NextResponse.json({ redirectTo: '/auth/login' });
    }

    const role = profile.role as string;

    let redirectTo = '/';

    switch (role) {
      case 'student':
        redirectTo = '/app/student/dashboard';
        break;
      case 'program_holder':
      case 'instructor':
        redirectTo = '/app/program-holder/dashboard';
        break;
      case 'admin':
      case 'super_admin':
        redirectTo = '/app/admin/dashboard';
        break;
      case 'grant_client':
        redirectTo = '/app/grants';
        break;
      case 'vita_staff':
        redirectTo = '/tax';
        break;
      case 'supersonic_staff':
        redirectTo = '/app/supersonic';
        break;
      default:
        redirectTo = '/app/student/dashboard';
    }

    return NextResponse.json({ redirectTo });
  } catch (error) { /* Error handled silently */ 
    logger.error('Auth landing error:', error);
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 500 }
    );
  }
}
