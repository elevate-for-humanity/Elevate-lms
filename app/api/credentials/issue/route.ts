import { createAdminClient } from '@/lib/supabase/admin';
import { generateCredentialCode, generateShareToken } from '@/lib/credential-generator';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// =====================================================
// ISSUE CREDENTIAL API - ADMIN ONLY
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth';
import { requireAuthAPI } from '@/lib/auth-guard';
import { requireRoleAPI } from '@/lib/rbac-guard';
import { randomCredentialCode } from '@/lib/crypto-utils';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const IssueSchema = z.object({
  title: z.string().min(2),
  credentialType: z.string().min(2),
  studentId: z.string().uuid(),
  programId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
  issuerOrgId: z.string().uuid().optional(),
  expiresInDays: z.number().min(1).max(3650).optional(),
  metadata: z.record(z.any()).optional(),
});

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Auth check
    const session = await requireAuthAPI();
    if (session instanceof Response) return session;

    // Role check
    const roleCheck = requireRoleAPI(session, ['admin', 'super_admin', 'advisor']);
    if (roleCheck instanceof Response) return roleCheck;

    // Parse body
    const body = await req.json();
    const parsed = IssueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createServerSupabaseClient();

    // Generate credential code
    const code = randomCredentialCode();
    const issuedAt = new Date();
    const expiresAt = data.expiresInDays
      ? new Date(issuedAt.getTime() + data.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create credential
    const { data: credential, error } = await supabase
      .from('credentials')
      .insert({
        code,
        student_id: data.studentId,
        program_id: data.programId,
        course_id: data.courseId,
        credential_type: data.credentialType,
        issuer_org_id: data.issuerOrgId,
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt?.toISOString(),
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to issue credential', { error, data });
      return NextResponse.json(
        { error: 'Failed to issue credential' },
        { status: 500 }
      );
    }

    // Log issuance
    await supabase.from('audit_logs').insert({
      event_type: 'credential_issued',
      resource_type: 'credential',
      resource_id: credential.id,
      user_id: session.user.id,
      metadata: {
        credential_type: data.credentialType,
        student_id: data.studentId,
        program_id: data.programId,
      },
    });

    logger.info('Credential issued', {
      credentialId: credential.id,
      studentId: data.studentId,
      issuedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      credential: {
        id: credential.id,
        code: credential.code,
        issued_at: credential.issued_at,
        expires_at: credential.expires_at,
      },
    });
  } catch (error) {
    logger.error('Credential issuance error', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/credentials/issue', _POST);
