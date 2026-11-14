import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to protect test endpoints in production
 *
 * Usage:
 * export const GET = protectTestEndpoint(async (req) => {
 *   // Your test logic here
 * });
 */
export function protectTestEndpoint<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse<T>>,
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Require authentication in development
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Test endpoints require authentication' },
        { status: 401 },
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Test endpoints require admin role' },
        { status: 403 },
      );
    }

    // Execute handler
    return handler(request, context);
  };
}

/**
 * Simple check if endpoint should be accessible
 */
export function isTestEndpointAllowed(): boolean {
  return process.env.NODE_ENV !== 'production';
}
