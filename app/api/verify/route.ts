export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

// ── Helpers ────────────────────────────────────────────────────────────────

function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || '0.0.0.0';
}

function hashIp(ip: string): string {
  const salt = process.env.VERIFY_RATE_LIMIT_SALT || 'elevate-verify-default';
  return crypto.createHash('sha256').update(`${ip}:${salt}`).digest('hex');
}

function normalizeCredentialId(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}

async function logAudit(
  supabase: ReturnType<typeof createAdminClient>,
  ipHash: string,
  credentialId: string,
  result: 'ok' | 'not_found' | 'blocked' | 'error'
) {
  if (!supabase) return;
  await db
    .from('verify_audit')
    .insert({ ip_hash: ipHash, credential_id: credentialId, result })
    .catch(() => null); // fail silently
}

// ── Route ──────────────────────────────────────────────────────────────────

/**
 * POST /api/verify
 * Rate-limited credential verification with audit logging.
 */
export async function POST(req: NextRequest) {
  const supabase = createAdminClient();
  const ip = getClientIp(req.headers);
  const ipHash = hashIp(ip);

  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) {
      await logAudit(supabase, ipHash, '', 'blocked');
      rateLimited.headers.set('Retry-After', '60');
      return rateLimited;
    }

    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { ok: false, reason: 'invalid_input' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawId = normalizeCredentialId(body.credentialId || '');

    if (rawId.length < 4 || rawId.length > 64 || !/^[A-Z0-9_-]+$/.test(rawId)) {
      return NextResponse.json(
        { ok: false, reason: 'invalid_input' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { ok: false, reason: 'service_unavailable' },
        { status: 503 }
      );
    }

    const { data: certificate, error } = await db
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
      await logAudit(supabase, ipHash, rawId, 'not_found');
      return NextResponse.json(
        { ok: false, reason: 'not_found' },
        { status: 404 }
      );
    }

    if (certificate.is_revoked) {
      await logAudit(supabase, ipHash, rawId, 'ok');
      return NextResponse.json({
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
      });
    }

    const [profileResult, courseResult] = await Promise.all([
      certificate.user_id
        ? db.from('profiles').select('full_name').eq('id', certificate.user_id).maybeSingle()
        : Promise.resolve({ data: null }),
      certificate.course_id
        ? db.from('courses').select('title').eq('id', certificate.course_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    await logAudit(supabase, ipHash, rawId, 'ok');

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
    await logAudit(supabase, ipHash, '', 'error');
    logger.error('[Verify API Error]:', err);
    return NextResponse.json(
      { ok: false, reason: 'server_error' },
      { status: 500 }
    );
  }
}
