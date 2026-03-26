import { createClient } from '@/lib/supabase/server';
import { withErrorHandling, APIErrors } from '@/lib/api';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';
import { 
  canEvaluateTransfer, 
  type TransferSourceType,
  TRANSFER_DOCS_BY_SOURCE 
} from '@/lib/documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Map form source values to TransferSourceType
const SOURCE_TYPE_MAP: Record<string, TransferSourceType> = {
  barber_school: 'in_state_barber_school',
  cosmetology_school: 'in_state_barber_school',
  out_of_state_license: 'out_of_state_license',
  previous_apprenticeship: 'previous_apprenticeship',
  work_experience: 'work_experience',
};

export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw APIErrors.unauthorized();
  }

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

  // Validate required fields
  if (!apprenticeId || !source || !hoursRequested) {
    throw APIErrors.validation(
      'apprenticeId, source, hoursRequested',
      'Missing required fields'
    );
  }

  // Validate hours
  const hours = parseInt(hoursRequested);
  if (isNaN(hours) || hours <= 0) {
    throw APIErrors.validation('hoursRequested', 'Invalid hours value');
  }

  // Verify apprentice belongs to user
  const { data: apprentice, error: apprenticeError } = await supabase
    .from('apprentices')
    .select('id, user_id, program_id, programs(total_hours)')
    .eq('id', apprenticeId)
    .single();

  if (apprenticeError || !apprentice) {
    throw APIErrors.notFound('Apprentice');
  }

  if (apprentice.user_id !== user.id) {
    throw APIErrors.forbidden('You can only submit requests for your own account');
  }

  // Validate hours don't exceed 50% of program total
  const maxHours = Math.floor((apprentice.programs?.total_hours || 2000) * 0.5);
  if (hours > maxHours) {
    throw APIErrors.validation(
      'hoursRequested',
      `Hours cannot exceed ${maxHours} (50% of program total)`
    );
  }

  // Validate at least one document provided
  if (!documentIds || documentIds.length === 0) {
    throw APIErrors.validation(
      'documentIds',
      'At least one supporting document is required'
    );
  }

  // Map source to TransferSourceType
  const sourceType = SOURCE_TYPE_MAP[source] || 'work_experience';

  // Check if documents are verified for auto-evaluation
  // Transfer requests can be SUBMITTED without verification,
  // but evaluation/crediting requires verification
  const verificationCheck = await canEvaluateTransfer(user.id, sourceType);
  
  // Determine initial status based on verification
  // If docs are verified, can proceed to evaluation
  // If not verified, status is 'requires_manual_review'
  const initialStatus = verificationCheck.allowed 
    ? 'pending' 
    : 'requires_manual_review';

  // Create transfer request
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
    .single();

  if (insertError) {
    throw APIErrors.database('Failed to create transfer request');
  }

  // Audit log
  await auditLog({
    actorId: user.id,
    actorRole: 'student',
    action: AuditAction.TRANSFER_REQUESTED,
    entity: AuditEntity.APPRENTICE,
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
