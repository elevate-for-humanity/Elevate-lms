import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import {
  type IeapFormData,
  type Section188ChecklistData,
  type WioaComplianceFormType,
  validateIeapForm,
  validateSection188Checklist,
  IEAP_INITIAL,
  SECTION_188_INITIAL,
} from '@/lib/compliance/wioa-etpl-forms';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ programId: string }> };

export async function GET(request: NextRequest, ctx: RouteCtx) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await ctx.params;

  try {
    const db = await requireAdminClient();

    const { data: program, error: programError } = await db
      .from('programs')
      .select(
        'id, title, slug, description, cip_code, soc_code, estimated_hours, estimated_weeks, credential_name, etpl_listed, etpl_requires_initial_eligibility, intraining_program_id',
      )
      .eq('id', programId)
      .maybeSingle();

    if (programError) {
      logger.error('[wioa-etpl GET] program query failed', programError);
      return safeInternalError(programError, 'Failed to load program');
    }
    if (!program) return safeError('Program not found', 404);

    const { data: forms, error: formsError } = await db
      .from('program_wioa_compliance_forms')
      .select('*')
      .eq('program_id', programId);

    if (formsError) {
      logger.error('[wioa-etpl GET] forms query failed', formsError);
      return safeInternalError(formsError, 'Failed to load compliance forms');
    }

    const byType = Object.fromEntries(
      (forms ?? []).map((row) => [row.form_type, row]),
    );

    return NextResponse.json({
      program,
      forms: {
        initial_eligibility_aggregate_performance:
          byType.initial_eligibility_aggregate_performance ?? null,
        section_188_checklist: byType.section_188_checklist ?? null,
      },
      defaults: {
        ieap: IEAP_INITIAL,
        section188: SECTION_188_INITIAL,
      },
    });
  } catch (err) {
    logger.error('[wioa-etpl GET] error', err);
    return safeInternalError(err, 'Failed to load WIOA ETPL forms');
  }
}

export async function PUT(request: NextRequest, ctx: RouteCtx) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { programId } = await ctx.params;

  try {
    const body = await request.json();
    const formType = body.form_type as WioaComplianceFormType;
    const responses = body.responses as IeapFormData | Section188ChecklistData;
    const markComplete = Boolean(body.mark_complete);

    if (
      formType !== 'initial_eligibility_aggregate_performance' &&
      formType !== 'section_188_checklist'
    ) {
      return safeError('Invalid form_type', 400);
    }

    const db = await requireAdminClient();

    const { data: program, error: programError } = await db
      .from('programs')
      .select('id, etpl_requires_initial_eligibility')
      .eq('id', programId)
      .maybeSingle();

    if (programError || !program) {
      return safeError('Program not found', 404);
    }

    if (
      formType === 'initial_eligibility_aggregate_performance' &&
      program.etpl_requires_initial_eligibility === false
    ) {
      return safeError(
        'Initial Eligibility Aggregate Performance is only required for new ETPL programs',
        400,
      );
    }

    const validation =
      formType === 'initial_eligibility_aggregate_performance'
        ? validateIeapForm(responses as IeapFormData, { requireCompletion: markComplete })
        : validateSection188Checklist(responses as Section188ChecklistData, {
            requireCompletion: markComplete,
          });

    if (!validation.valid) {
      return safeError(validation.error ?? 'Validation failed', 400);
    }

    const status = markComplete ? 'completed' : 'draft';
    const completedAt = markComplete ? new Date().toISOString() : null;
    const completedBy = markComplete ? auth.id : null;

    const { data: saved, error: upsertError } = await db
      .from('program_wioa_compliance_forms')
      .upsert(
        {
          program_id: programId,
          form_type: formType,
          responses,
          status,
          completed_at: completedAt,
          completed_by: completedBy,
        },
        { onConflict: 'program_id,form_type' },
      )
      .select()
      .single();

    if (upsertError) {
      logger.error('[wioa-etpl PUT] upsert failed', upsertError);
      return safeInternalError(upsertError, 'Failed to save form');
    }

    if (markComplete && formType === 'initial_eligibility_aggregate_performance') {
      await db
        .from('programs')
        .update({ etpl_requires_initial_eligibility: false })
        .eq('id', programId);
    }

    return NextResponse.json({ form: saved });
  } catch (err) {
    logger.error('[wioa-etpl PUT] error', err);
    return safeInternalError(err, 'Failed to save WIOA ETPL form');
  }
}
