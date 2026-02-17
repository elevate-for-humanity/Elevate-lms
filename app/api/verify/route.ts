export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

/**
 * POST /api/verify
 * Rate-limited credential verification endpoint.
 * Accepts { credentialId: string } and returns verification result.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 'contact' tier = 3 req/min per IP
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { ok: false, reason: 'invalid_input' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawId = (body.credentialId || '').trim();

    if (rawId.length < 4 || rawId.length > 128) {
      return NextResponse.json(
        { ok: false, reason: 'invalid_input' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, reason: 'service_unavailable' },
        { status: 503 }
      );
    }

    // Query certificates table (existing schema)
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select(`
        id,
        certificate_number,
        issued_at,
        expires_at,
        status,
        is_revoked,
        credential_name,
        user_id,
        course_id
      `)
      .or(`id.eq.${rawId},certificate_number.eq.${rawId}`)
      .maybeSingle();

    if (error || !certificate) {
      return NextResponse.json(
        { ok: false, reason: 'not_found' },
        { status: 404 }
      );
    }

    if (certificate.is_revoked) {
      return NextResponse.json(
        {
          ok: true,
          record: {
            credentialId: certificate.certificate_number || certificate.id,
            status: 'revoked',
            fullName: '[Revoked]',
            program: '',
            credentialType: certificate.credential_name || '',
            issuedAt: certificate.issued_at,
            expiresAt: certificate.expires_at,
          },
        },
        { status: 200 }
      );
    }

    // Fetch related data
    const [profileResult, courseResult] = await Promise.all([
      certificate.user_id
        ? supabase.from('profiles').select('full_name').eq('id', certificate.user_id).maybeSingle()
        : Promise.resolve({ data: null }),
      certificate.course_id
        ? supabase.from('courses').select('title').eq('id', certificate.course_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      ok: true,
      record: {
        credentialId: certificate.certificate_number || certificate.id,
        fullName: profileResult.data?.full_name || 'N/A',
        program: courseResult.data?.title || certificate.credential_name || 'N/A',
        credentialType: certificate.credential_name || 'Certificate of Completion',
        issuedAt: certificate.issued_at,
        expiresAt: certificate.expires_at || null,
        status: certificate.status || 'active',
      },
    });
  } catch (err) {
    logger.error('[Verify API Error]:', err);
    return NextResponse.json(
      { ok: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}
