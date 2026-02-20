
export const runtime = 'nodejs';
export const maxDuration = 60;

// =====================================================
// CREDENTIAL VERIFICATION API - PUBLIC
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/credentials/verify
 * Public API for credential verification
 * Returns minimal info for public, full info for authenticated partners
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid credential code' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated (partner)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Lookup credential
    const { data: credential, error } = await supabase
      .from('credentials')
      .select(
        `
        id,
        code,
        issued_at,
        expires_at,
        revoked_at,
        revoked_reason,
        credential_type,
        student_id,
        program_id,
        course_id,
        issuer_org_id,
        metadata,
        profiles!student_id (
          first_name,
          last_name,
          email
        ),
        programs (
          title
        )
      `
      )
      .eq('code', code)
      .single();

    if (error || !credential) {
      // Generic response to prevent scraping
      logger.info('Credential verification failed', { code });
      return NextResponse.json(
        { valid: false, message: 'Credential not found' },
        { status: 404 }
      );
    }

    // Check expiration
    const now = new Date();
    const isExpired = credential.expires_at && new Date(credential.expires_at) < now;
    const isRevoked = !!credential.revoked_at;
    const isValid = !isExpired && !isRevoked;

    // Log verification attempt
    await supabase.from('audit_logs').insert({
      event_type: 'credential_viewed',
      resource_type: 'credential',
      resource_id: credential.id,
      user_id: session?.user?.id || null,
      metadata: {
        code,
        viewer_role: session?.user?.user_metadata?.role || 'public',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      },
    });

    // Determine response based on authentication
    if (session && session.user.user_metadata?.role === 'partner') {
      // Full info for authenticated partners
      return NextResponse.json({
        valid: isValid,
        credential: {
          id: credential.id,
          code: credential.code,
          type: credential.credential_type,
          issued_at: credential.issued_at,
          expires_at: credential.expires_at,
          revoked_at: credential.revoked_at,
          revoked_reason: credential.revoked_reason,
          student: {
            first_name: (credential.profiles as any)?.first_name,
            last_name: (credential.profiles as any)?.last_name,
            email: (credential.profiles as any)?.email,
          },
          program: {
            title: (credential.programs as any)?.title,
          },
          metadata: credential.metadata,
        },
        status: isRevoked ? 'revoked' : isExpired ? 'expired' : 'valid',
      });
    } else {
      // Minimal info for public
      return NextResponse.json({
        valid: isValid,
        credential: {
          code: credential.code,
          type: credential.credential_type,
          issued_at: credential.issued_at,
          expires_at: credential.expires_at,
          student: {
            first_name: (credential.profiles as any)?.first_name,
            last_initial: (credential.profiles as any)?.last_name?.charAt(0) || '',
          },
          program: {
            title: (credential.programs as any)?.title,
          },
        },
        status: isRevoked ? 'revoked' : isExpired ? 'expired' : 'valid',
      });
    }
  } catch (error) {
    logger.error('Credential verification error', { error });
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/credentials/verify?code=XXX
 * Alternative GET endpoint for simple verification
 */
export async function GET(req: NextRequest) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.json(
      { error: 'Missing credential code' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  return POST(
    new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: req.headers,
    })
  );
}
