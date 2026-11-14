import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  CourseBuilderCreditsError,
  getCourseBuilderCreditOwner,
  refundCourseBuilderCredits,
  reserveCourseBuilderCredits,
  type MeteredCourseBuilderOperation,
} from './credits';

export type CreditReservation = Awaited<ReturnType<typeof reserveCourseBuilderCredits>> & {
  tenantId: string;
  operation: MeteredCourseBuilderOperation;
};

export function courseBuilderCreditErrorResponse(error: unknown) {
  if (!(error instanceof CourseBuilderCreditsError)) return null;
  const status =
    error.code === 'INSUFFICIENT_CREDITS' ? 402 : error.code === 'TENANT_REQUIRED' ? 409 : 503;
  return NextResponse.json(
    { ok: false, error: error.message, code: error.code, balance: error.balance },
    { status },
  );
}

export async function reserveCourseBuilderRequestCredits(input: {
  request: NextRequest;
  userId: string;
  effectiveRoles: string[];
  operation: MeteredCourseBuilderOperation;
  metadata?: Record<string, unknown>;
}): Promise<CreditReservation | null> {
  const db = await requireAdminClient();
  const owner = await getCourseBuilderCreditOwner({
    db,
    userId: input.userId,
    effectiveRoles: input.effectiveRoles,
  });
  if (owner.operator) return null;
  if (!owner.tenantId) {
    throw new CourseBuilderCreditsError(
      'Course Builder billing owner is missing',
      'TENANT_REQUIRED',
    );
  }
  const idempotencyKey = String(input.request.headers.get('idempotency-key') ?? '').trim();
  if (!idempotencyKey || idempotencyKey.length > 200) {
    throw new CourseBuilderCreditsError(
      'A valid Idempotency-Key is required for credit-metered Course Builder work',
      'CREDIT_SERVICE_ERROR',
    );
  }
  const reservation = await reserveCourseBuilderCredits({
    db,
    tenantId: owner.tenantId,
    userId: input.userId,
    operation: input.operation,
    idempotencyKey: `course-builder:${owner.tenantId}:${idempotencyKey}`,
    metadata: input.metadata,
  });
  return { ...reservation, tenantId: owner.tenantId, operation: input.operation };
}

export async function refundCourseBuilderRequestCredits(
  reservation: CreditReservation | null,
  userId: string,
  reason: string,
) {
  if (!reservation) return;
  try {
    await refundCourseBuilderCredits({
      db: await requireAdminClient(),
      tenantId: reservation.tenantId,
      userId,
      operation: reservation.operation,
      reservationKey: reservation.reservationKey,
      reason,
    });
  } catch (error) {
    logger.error('[course-builder] Credit refund failed', error, {
      reservationKey: reservation.reservationKey,
      reason,
    });
  }
}
