import { NextResponse } from 'next/server';

/**
 * Lightweight auth check for API routes.
 * Works in both Edge and Node.js runtimes.
 *
 * Validates the Authorization header contains a Bearer token,
 * then verifies it against Supabase auth.
 *
 * Usage:
 *   const auth = await requireAuth(request);
 *   if (auth.error) return auth.error;
 *   // auth.userId is available
 */
export async function requireAuth(request: Request): Promise<{
  userId: string | null;
  error: NextResponse | null;
}> {
  // Try Authorization header first (API clients, edge runtime)
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (!authHeader && !cookieHeader) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  // Use the token from Authorization header or extract from cookies
  const token = authHeader?.replace('Bearer ', '') || '';

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token || extractTokenFromCookies(cookieHeader)}`,
        apikey: supabaseAnonKey,
      },
    });

    if (!response.ok) {
      return {
        userId: null,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    const user = await response.json();
    if (!user?.id) {
      return {
        userId: null,
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
      };
    }

    return { userId: user.id, error: null };
  } catch {
    return {
      userId: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      ),
    };
  }
}

/**
 * Extract Supabase access token from cookie header.
 * Supabase stores tokens in sb-<ref>-auth-token cookie.
 */
function extractTokenFromCookies(cookieHeader: string | null): string {
  if (!cookieHeader) return '';
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    if (cookie.includes('-auth-token')) {
      try {
        const value = cookie.split('=').slice(1).join('=');
        const decoded = decodeURIComponent(value);
        // Supabase stores as JSON array [access_token, refresh_token, ...]
        // or as base64 chunks
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed) && parsed[0]) return parsed[0];
        if (parsed.access_token) return parsed.access_token;
      } catch {
        // Not JSON, try raw value
        const value = cookie.split('=').slice(1).join('=');
        if (value.startsWith('ey')) return value;
      }
    }
  }
  return '';
}
