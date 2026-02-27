import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { useToken } from '@/lib/notifications';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
// AUTH: Intentionally public — no authentication required

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validate and use a notification token for no-login access.
 * Returns the target URL and metadata if valid.
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = await useToken(token);

    if (!result || !result.valid) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          valid: false,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      targetUrl: result.targetUrl,
      purpose: result.purpose,
      email: result.email,
      metadata: result.metadata,
    });
  } catch (error) {
    logger.error('Token validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate token' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for simple token validation (redirect flow)
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=missing_token', request.url));
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = await useToken(token);

  if (!result || !result.valid) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  // Redirect to target URL
  if (result.targetUrl) {
    return NextResponse.redirect(result.targetUrl);
  }

  return NextResponse.redirect(new URL('/login', request.url));
}
export const GET = withApiAudit('/api/token/validate', _GET);
export const POST = withApiAudit('/api/token/validate', _POST);
