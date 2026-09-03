// =====================================================
// ISSUE CREDENTIAL API - ADMIN ONLY
// Canonical path: credential definition -> learner_credentials award.
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthAPI } from '@/lib/auth-guard';
import { requireRoleAPI } from '@/lib/rbac-guard';
import { requireAdminClient } from '@/lib/supabase/admin';
import { issueNativeOpenBadge } from '@/lib/credentials/native-issuer';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const IssueSchema = z.object({
  credentialId: z.string().uuid(),
  studentId: z.string().uuid(),
  programId: z.string().uuid().optional(),
  attemptId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
  examScore: z.number().min(0).max(100).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const session = await requireAuthAPI();
    if (session instanceof Response) return session;

    const roleCheck = requireRoleAPI(session, ['admin', 'super_admin', 'org_admin', 'staff']);
    if (roleCheck instanceof Response) return roleCheck;

    const parsed = IssueSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const db = await requireAdminClient();

    const { data: definition, error: definitionError } = await db
      .from('credentials')
      .select('id, name, partner_id, open_badges_enabled')
      .eq('id', data.credentialId)
      .maybeSingle();

    if (definitionError || !definition) {
      return NextResponse.json({ error: 'Credential definition not found' }, { status: 404 });
    }

    let isInternalIssuer = false;
    if (definition.partner_id) {
      const { data: partner } = await db
        .from('credentialing_partners')
        .select('type')
        .eq('id', definition.partner_id)
        .maybeSingle();
      isInternalIssuer = partner?.type === 'internal';
    }

    const { data: existing } = await db
      .from('learner_credentials')
      .select('id, verification_code, status, open_badge_status')
      .eq('learner_id', data.studentId)
      .eq('credential_id', data.credentialId)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          duplicate: true,
          award: existing,
          message: 'Learner already has an active award for this credential',
        },
        { status: 200 },
      );
    }

    const issuedAt = new Date().toISOString();
    const { data: award, error } = await db
      .from('learner_credentials')
      .insert({
        learner_id: data.studentId,
        credential_id: data.credentialId,
        program_id: data.programId ?? null,
        issued_at: issuedAt,
        expires_at: data.expiresAt ?? null,
        issued_by: session.user.id,
        exam_score: data.examScore ?? null,
        status: 'active',
        open_badge_status:
          isInternalIssuer && definition.open_badges_enabled ? 'pending' : 'not_issued',
        metadata: {
          ...(data.metadata ?? {}),
          ...(data.attemptId ? { credential_attempt_id: data.attemptId } : {}),
        },
      })
      .select('id, verification_code, issued_at, expires_at, status, open_badge_status')
      .maybeSingle();

    if (error || !award) {
      logger.error('Failed to issue learner credential', new Error(error?.message ?? 'unknown error'), {
        credentialId: data.credentialId,
        studentId: data.studentId,
      });
      return NextResponse.json({ error: 'Failed to issue credential' }, { status: 500 });
    }

    if (data.attemptId) {
      await db
        .from('credential_attempts')
        .update({ credential_issued_id: award.id })
        .eq('id', data.attemptId);
    }

    let openBadge: Awaited<ReturnType<typeof issueNativeOpenBadge>> | null = null;
    if (isInternalIssuer && definition.open_badges_enabled) {
      openBadge = await issueNativeOpenBadge(award.id);
    }

    await db.from('audit_logs').insert({
      event_type: 'credential_issued',
      resource_type: 'learner_credential',
      resource_id: award.id,
      user_id: session.user.id,
      metadata: {
        credential_id: data.credentialId,
        credential_name: definition.name,
        learner_id: data.studentId,
        program_id: data.programId ?? null,
        issuer_authority: isInternalIssuer ? 'internal' : 'external',
        open_badge_status: openBadge?.success ? openBadge.status : award.open_badge_status,
      },
    });

    return NextResponse.json({ success: true, award, openBadge });
  } catch (error) {
    logger.error(
      'Credential issuance error',
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/credentials/issue', _POST);
