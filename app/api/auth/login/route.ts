/**
 * @deprecated Use /api/auth/signin instead.
 * This route duplicates /api/auth/signin and uses the deprecated in-memory
 * rate limiter (lib/rateLimit). It is kept only for backward compatibility
 * with any existing callers. Do not add new callers — use /api/auth/signin.
 */
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;

    
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });
  } catch (err) {
    logger.error('Login error:', err);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json(
    { error: 'Method not allowed. Use POST to login.' },
    { status: 405 }
  );
}
export const GET = withApiAudit('/api/auth/login', _GET);
export const POST = withApiAudit('/api/auth/login', _POST);
