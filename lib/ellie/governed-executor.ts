import type { SupabaseClient } from '@supabase/supabase-js';

import { issueProgramCertificate } from '@/lib/certificates/compiler';
import type { EllieActionType } from './actions';
import { assertActionPolicy, type ActionExecutionContext } from './action-policy';
import { executeEllieAction } from './executor';

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

async function executeCanonicalCertificate(
  params: Record<string, unknown>,
  db: SupabaseClient,
) {
  const userId = text(params.userId);
  const courseId = text(params.courseId);
  const programId = text(params.programId);
  const programSlug = text(params.programSlug);
  const enrollmentId = text(params.enrollmentId);
  const studentName = text(params.studentName);
  const courseTitle = text(params.courseTitle);

  const missing = [
    ['userId', userId],
    ['courseId', courseId],
    ['programId', programId],
    ['programSlug', programSlug],
    ['enrollmentId', enrollmentId],
    ['studentName', studentName],
    ['courseTitle', courseTitle],
  ].filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    return {
      success: false,
      message: `Certificate request requires canonical completion context: ${missing.join(', ')}. No certificate was issued.`,
      data: { missingFields: missing },
    };
  }

  const result = await issueProgramCertificate(db as never, {
    userId: userId!,
    courseId: courseId!,
    programId: programId!,
    programSlug: programSlug!,
    enrollmentId: enrollmentId!,
    studentName: studentName!,
    studentEmail: text(params.studentEmail),
    courseTitle: courseTitle!,
    requiresFinalExam: params.requiresFinalExam === true,
    minimumHours: typeof params.minimumHours === 'number' ? params.minimumHours : undefined,
    certificateRequirements: params.certificateRequirements as never,
  });

  return {
    success: result.success,
    message: result.success
      ? result.alreadyIssued
        ? 'Certificate already existed; no duplicate was created.'
        : 'Certificate issued through the canonical completion gate.'
      : result.error || 'Certificate gate did not permit issuance.',
    data: {
      certificateId: result.certificateId,
      certificateNumber: result.certificateNumber,
      alreadyIssued: result.alreadyIssued,
    },
  };
}

export async function executeGovernedEllieAction(
  actionType: EllieActionType,
  params: Record<string, unknown>,
  db: SupabaseClient,
  context: ActionExecutionContext,
) {
  const policy = assertActionPolicy(actionType, context);
  const result = actionType === 'issue_certificate'
    ? await executeCanonicalCertificate(params, db)
    : await executeEllieAction(actionType, params, db);
  return { ...result, policy: policy.policy, policyReason: policy.reason };
}
