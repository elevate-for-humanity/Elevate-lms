import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimitNew as rateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate limit: 5 login attempts per minute per IP
    const identifier = getClientIdentifier(request.headers);
    const rateLimitResult = rateLimit(identifier, RATE_LIMITS.AUTH);
    
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

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
        { error: error.message },
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

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to login.' },
    { status: 405 }
  );
}
