import type { SupabaseClient } from '@/lib/supabase';

export const COURSE_BUILDER_APP_SLUG = 'course-creation-learning-platform';
export const COURSE_BUILDER_MONTHLY_ALLOWANCE = 2_500;

export const COURSE_BUILDER_CREDIT_COSTS = {
  generate: 1_500,
  'generate-from-blueprint': 1_200,
  repair: 600,
  'generate-missing': 600,
  'queue-media': 250,
  'ai-write': 250,
  assessment: 500,
  integrated: 1_500,
} as const;

export type MeteredCourseBuilderOperation = keyof typeof COURSE_BUILDER_CREDIT_COSTS;

export class CourseBuilderCreditsError extends Error {
  constructor(
    message: string,
    readonly code: 'TENANT_REQUIRED' | 'INSUFFICIENT_CREDITS' | 'CREDIT_SERVICE_ERROR',
    readonly balance = 0,
  ) {
    super(message);
    this.name = 'CourseBuilderCreditsError';
  }
}

export async function getCourseBuilderCreditOwner(input: {
  db: SupabaseClient;
  userId: string;
  effectiveRoles: string[];
}) {
  const operator = input.effectiveRoles.some((role) =>
    ['admin', 'super_admin', 'staff'].includes(role),
  );
  const { data, error } = await input.db
    .from('profiles')
    .select('tenant_id')
    .eq('id', input.userId)
    .maybeSingle();
  if (error)
    throw new CourseBuilderCreditsError(
      'Unable to resolve Course Builder billing owner',
      'CREDIT_SERVICE_ERROR',
    );
  if (!data?.tenant_id && !operator) {
    throw new CourseBuilderCreditsError(
      'An organization is required to use metered Course Builder operations',
      'TENANT_REQUIRED',
    );
  }
  return { tenantId: data?.tenant_id ?? null, operator };
}

export async function getCourseBuilderCreditBalance(db: SupabaseClient, tenantId: string) {
  const { data, error } = await db
    .from('tenant_course_builder_credit_wallets')
    .select('balance,lifetime_granted,lifetime_used,current_period_start,current_period_end')
    .eq('tenant_id', tenantId)
    .eq('app_slug', COURSE_BUILDER_APP_SLUG)
    .maybeSingle();
  if (error)
    throw new CourseBuilderCreditsError(
      'Unable to load Course Builder credits',
      'CREDIT_SERVICE_ERROR',
    );
  return (
    data ?? {
      balance: 0,
      lifetime_granted: 0,
      lifetime_used: 0,
      current_period_start: null,
      current_period_end: null,
    }
  );
}

export async function reserveCourseBuilderCredits(input: {
  db: SupabaseClient;
  tenantId: string;
  userId: string;
  operation: MeteredCourseBuilderOperation;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}) {
  const cost = COURSE_BUILDER_CREDIT_COSTS[input.operation];
  const { data, error } = await input.db.rpc('consume_tenant_course_builder_credits', {
    p_tenant_id: input.tenantId,
    p_user_id: input.userId,
    p_app_slug: COURSE_BUILDER_APP_SLUG,
    p_operation: input.operation,
    p_cost: cost,
    p_idempotency_key: input.idempotencyKey,
    p_metadata: input.metadata ?? {},
  });
  if (error)
    throw new CourseBuilderCreditsError(
      'Course Builder credit reservation failed',
      'CREDIT_SERVICE_ERROR',
    );
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.success) {
    throw new CourseBuilderCreditsError(
      `This operation requires ${cost.toLocaleString()} credits. Upgrade or add credits to continue.`,
      'INSUFFICIENT_CREDITS',
      Number(result?.balance ?? 0),
    );
  }
  return {
    cost,
    balance: Number(result.balance ?? 0),
    reservationKey: input.idempotencyKey,
  };
}

export async function refundCourseBuilderCredits(input: {
  db: SupabaseClient;
  tenantId: string;
  userId: string;
  operation: MeteredCourseBuilderOperation;
  reservationKey: string;
  reason: string;
}) {
  const cost = COURSE_BUILDER_CREDIT_COSTS[input.operation];
  const { error } = await input.db.rpc('refund_tenant_course_builder_credits', {
    p_tenant_id: input.tenantId,
    p_user_id: input.userId,
    p_app_slug: COURSE_BUILDER_APP_SLUG,
    p_operation: `${input.operation}:refund`,
    p_credits: cost,
    p_idempotency_key: `${input.reservationKey}:refund`,
    p_metadata: { reason: input.reason, reservation_key: input.reservationKey },
  });
  if (error)
    throw new CourseBuilderCreditsError(
      'Course Builder credit refund failed',
      'CREDIT_SERVICE_ERROR',
    );
}
