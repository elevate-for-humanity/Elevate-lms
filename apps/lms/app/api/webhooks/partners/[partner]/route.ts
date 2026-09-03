import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { timingSafeEqual } from 'node:crypto';

// app/api/webhooks/partners/[partner]/route.ts
// Webhook endpoint for partner progress updates

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { PartnerType } from '@/lib/partners';

interface WebhookPayload {
  event: string;
  timestamp?: string;
  data: Record<string, unknown>;
}
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { toErrorMessage } from '@/lib/safe';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const PARTNER_TYPES = new Set<string>(['hsi', 'certiport', 'careersafe', 'jri', 'nrf', 'nds']);

function isPartnerType(value: string): value is PartnerType {
  return PARTNER_TYPES.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePayload(rawBody: string): WebhookPayload {
  const value: unknown = JSON.parse(rawBody);
  if (!isRecord(value) || typeof value.event !== 'string' || !isRecord(value.data)) {
    throw new Error('Webhook payload must include an event and data object');
  }

  return {
    event: value.event,
    data: value.data,
    ...(typeof value.timestamp === 'string' ? { timestamp: value.timestamp } : {}),
  };
}

function requireString(data: Record<string, unknown>, key: string): string {
  const value = data[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Webhook data.${key} must be a non-empty string`);
  }
  return value;
}

function optionalString(data: Record<string, unknown>, key: string): string | undefined {
  const value = data[key];
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function secretsMatch(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

async function _POST(request: NextRequest, { params }: { params: Promise<{ partner: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const { partner: partnerName } = await params;
  if (!isPartnerType(partnerName)) {
    return NextResponse.json({ error: 'Unknown partner' }, { status: 404 });
  }
  const partner = partnerName;

  try {
    // Get webhook secret from headers
    const providedSecret = request.headers.get('x-webhook-secret') || '';
    const rawBody = await request.text();

    // Verify webhook secret
    const webhookSecret = process.env.PARTNER_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      logger.error(`[Webhook] PARTNER_WEBHOOK_SECRET not configured`);
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    if (!secretsMatch(providedSecret, webhookSecret)) {
      logger.error(`[Webhook] Invalid secret for ${partner}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload = parsePayload(rawBody);

    logger.info(`[Webhook] ${partner} event: ${payload.event}`);

    // Process webhook based on event type
    switch (payload.event) {
      case 'enrollment.created':
        await handleEnrollmentCreated(partner, payload.data);
        break;

      case 'progress.updated':
        await handleProgressUpdated(partner, payload.data);
        break;

      case 'course.completed':
        await handleCourseCompleted(partner, payload.data);
        break;

      case 'certificate.issued':
        await handleCertificateIssued(partner, payload.data);
        break;

      default:
        logger.warn(`[Webhook] Unknown event type: ${payload.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      `[Webhook] Error processing ${partner} webhook:`,
      error instanceof Error ? error : new Error(String(error)),
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Internal server error' },
      { status: 500 },
    );
  }
}

async function handleEnrollmentCreated(
  partner: PartnerType,
  data: Record<string, unknown>,
): Promise<void> {
  const supabase = await requireAdminClient();
  const enrollmentId = requireString(data, 'enrollmentId');

  // Update enrollment status in database
  const { error } = await supabase
    .from('partner_lms_enrollments')
    .update({
      status: 'active',
      metadata: {
        webhook_received_at: new Date().toISOString(),
        external_data: data,
      },
    })
    .eq('external_enrollment_id', enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update enrollment', normalizeError(error, 'Update enrollment error'), getErrorContext(error));
  }
}

async function handleProgressUpdated(
  partner: PartnerType,
  data: Record<string, unknown>,
): Promise<void> {
  const supabase = await requireAdminClient();
  const enrollmentId = requireString(data, 'enrollmentId');
  const reportedProgress = data.percentage ?? data.progress;
  if (typeof reportedProgress !== 'number' || !Number.isFinite(reportedProgress)) {
    throw new Error('Webhook progress must be a finite number');
  }

  // Update progress in database
  const { error } = await supabase
    .from('partner_lms_enrollments')
    .update({
      progress_percentage: Math.min(100, Math.max(0, reportedProgress)),
      metadata: {
        last_synced_at: new Date().toISOString(),
        lessons_completed: data.lessonsCompleted,
        total_lessons: data.totalLessons,
      },
    })
    .eq('external_enrollment_id', enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update progress', normalizeError(error, 'Update progress error'), getErrorContext(error));
  }
}

async function handleCourseCompleted(
  partner: PartnerType,
  data: Record<string, unknown>,
): Promise<void> {
  const supabase = await requireAdminClient();
  const enrollmentId = requireString(data, 'enrollmentId');

  // Get the enrollment step
  const { data: step, error: stepError } = await supabase
    .from('enrollment_steps')
    .select('id, enrollment_id, provider_id')
    .eq('external_enrollment_id', enrollmentId)
    .eq('status', 'in_progress')
    .maybeSingle();

  if (stepError || !step) {
    logger.error('[Webhook] Failed to find enrollment step:', stepError);
    return;
  }

  // Mark step complete and advance to next
  const { data: nextStepId, error: advanceError } = await supabase.rpc('mark_step_complete', {
    p_step_id: step.id,
    p_external_enrollment_id: enrollmentId,
  });

  if (advanceError) {
    logger.error('[Webhook] Failed to advance step:', advanceError);
    return;
  }

  // Update partner enrollment record
  const { error } = await supabase
    .from('partner_lms_enrollments')
    .update({
      status: 'completed',
      progress_percentage: 100,
      completed_at: optionalString(data, 'completedAt') ?? new Date().toISOString(),
      metadata: {
        completion_webhook_received_at: new Date().toISOString(),
      },
    })
    .eq('external_enrollment_id', enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update completion', normalizeError(error, 'Update completion error'), getErrorContext(error));
  }

  // If there's a next step, auto-enroll
  if (nextStepId) {
    const { data: nextStep } = await supabase
      .from('enrollment_steps')
      .select('*, provider:partner_lms_providers(*), enrollment:enrollments(user_id)')
      .eq('id', nextStepId)
      .maybeSingle();

    if (nextStep) {
      // Trigger auto-enrollment in next partner
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/partner/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: nextStep.enrollment.user_id,
            providerId: nextStep.provider_id,
            enrollmentId: nextStep.enrollment_id,
            stepId: nextStep.id,
          }),
        });
      } catch (enrollError) {
        logger.error('[Webhook] Failed to auto-enroll in next partner:', enrollError);
      }
    }
  } else {
    // All steps complete - check if enrollment is done
    const { data: isComplete } = await supabase.rpc('is_enrollment_complete', {
      p_enrollment_id: step.enrollment_id,
    });

    if (isComplete) {
      // Generate completion certificate
      await supabase
        .from('program_enrollments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', step.enrollment_id);

      // Trigger completion email
      await supabase.functions.invoke('send-completion-email', {
        body: {
          enrollmentId: step.enrollment_id,
          partner,
        },
      });
    }
  }
}

async function handleCertificateIssued(
  partner: PartnerType,
  data: Record<string, unknown>,
): Promise<void> {
  const supabase = await requireAdminClient();
  const enrollmentId = requireString(data, 'enrollmentId');

  // Update enrollment with certificate data
  const { error } = await supabase
    .from('partner_lms_enrollments')
    .update({
      metadata: {
        certificate_id: requireString(data, 'certificateId'),
        certificate_number: optionalString(data, 'certificateNumber'),
        certificate_url: optionalString(data, 'downloadUrl'),
        certificate_issued_at: optionalString(data, 'issuedDate') ?? new Date().toISOString(),
      },
    })
    .eq('external_enrollment_id', enrollmentId);

  if (error) {
    logger.error('[Webhook] Failed to update certificate', normalizeError(error, 'Update certificate error'), getErrorContext(error));
  }
}
export const POST = withApiAudit('/api/webhooks/partners/[partner]', _POST, {
  actor_type: 'webhook',
  skip_body: true,
});
