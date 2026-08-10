import { createClient } from '@/lib/supabase/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import {
  canEvaluateTransfer,
  type TransferSourceType,
} from '@/lib/documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SOURCE_TYPE_MAP: Record<string, TransferSourceType> = {
  barber_school: 'in_state_barber_school',
  cosmetology_school: 'in_state_barber_school',
  out_of_state_license: 'out_of_state_license',
  previous_apprenticeship: 'previous_apprenticeship',
  work_experience: 'work_experience',
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw APIErrors.unauthorized();

  const body = await request.json();
  const {
    apprenticeId,
    source,
    hoursRequested,
    description,
    previousEmployer,
    employmentDates,
    documentIds,
  } = body;

  if (!apprenticeId || !source || !hoursRequested) {
    throw APIErrors.validation('apprenticeId, source, hoursRequested', 'Missing required fields');
  }

  const hours = Number.parseInt(String(hoursRequested), 10);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw APIErrors.validation('hoursRequested', 'Invalid hours value');
  }

  const { data: apprentice, error: apprenticeError } = await supabase
    .from('apprentices')
    .select('id, user_id, program_id, programs(total_hours)')
    .eq('id', apprenticeId)
    .maybeSingle();

  if (apprenticeError || !apprentice) throw APIErrors.notFound('Apprentice');
  if (apprentice.user_id !== user.id) {
    throw APIErrors.forbidden('You can only submit requests for your own account');
  }

  const programData = Array.isArray(apprentice.programs) ? apprentice.programs[0] : apprentice.programs;
  const maxHours = Math.floor((programData?.total_hours || 2000) * 0.5);
  if (hours > maxHours) {
    throw APIErrors.validation('hoursRequested', `Hours cannot exceed ${maxHours} (50% of program total)`);
  }

  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    throw APIErrors.validation('documentIds', 'At least one supporting document is required');
  }

  const sourceType = SOURCE_TYPE_MAP[source] || 'work_experience';
  const verificationCheck = await canEvaluateTransfer(user.id, sourceType);
  const initialStatus = verificationCheck.allowed ? 'pending' : 'requires_manual_review';

  const { data: transferRequest, error: insertError } = await supabase
    .from('hour_transfer_requests')
    .insert({
      apprentice_id: apprenticeId,
      source,
      source_type: sourceType,
      hours_requested: hours,
      description: description || null,
      previous_employer: previousEmployer || null,
      employment_dates: employmentDates || null,
      document_ids: documentIds,
      status: initialStatus,
      submitted_by: user.id,
      docs_verified: verificationCheck.allowed,
    })
    .select()
    .maybeSingle();

  if (insertError || !transferRequest) {
    throw APIErrors.internal('Failed to create transfer request', {
      databaseMessage: insertError?.message,
    });
  }

  await auditLog({
    actorId: user.id,
    actorRole: 'student',
    action: AuditAction.HOURS_LOGGED,
    entity: AuditEntity.HOURS,
    entityId: apprenticeId,
    metadata: {
      transfer_request_id: transferRequest.id,
      source,
      source_type: sourceType,
      hours_requested: hours,
      document_count: documentIds.length,
      docs_verified: verificationCheck.allowed,
      initial_status: initialStatus,
    },
  });

  return NextResponse.json({
    success: true,
    transferRequest: {
      id: transferRequest.id,
      status: transferRequest.status,
      hours_requested: transferRequest.hours_requested,
      docs_verified: verificationCheck.allowed,
    },
    message: verificationCheck.allowed
      ? 'Transfer request submitted for evaluation'
      : 'Transfer request submitted. Document verification is required before hours can be credited.',
  });
});
