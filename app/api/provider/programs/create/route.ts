export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/provider/programs/create
// Creates a new program record in draft/pending_review state for a provider tenant.
// Separate from /api/provider/programs/submit which submits an EXISTING program for review.
// After creation, automatically submits for admin review via provider_program_approvals.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { providerApiGuard } from '@/lib/api/provider-guard';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const guard = await providerApiGuard();
  if (guard.error) return guard.error;
  const { tenantId } = guard;

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return safeError('Invalid request body', 400); }

  const {
    title, category, description,
    estimatedWeeks, totalHours, tuition,
    credentialName, credentialType,
    wioaApproved, fundingEligible,
    nextStartDate, seatsAvailable,
    serviceArea, deliveryMode,
  } = body as Record<string, unknown>;

  if (!title || !(title as string).trim()) {
    return safeError('Program title is required', 400);
  }

  const supabase = await createClient();

  // Generate slug from title
  const base = (title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  let slug = base;
  let suffix = 0;
  while (true) {
    const { count } = await supabase
      .from('programs')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug);
    if ((count ?? 0) === 0) break;
    suffix++;
    slug = `${base}-${suffix}`;
    if (suffix > 100) { slug = `${base}-${Date.now()}`; break; }
  }

  const { data: program, error: createError } = await supabase
    .from('programs')
    .insert({
      title: (title as string).trim(),
      slug,
      category: category ?? null,
      description: description ?? null,
      estimated_weeks: estimatedWeeks ? Number(estimatedWeeks) : null,
      total_hours: totalHours ? Number(totalHours) : null,
      tuition: tuition ? Number(tuition) : null,
      credential_name: credentialName ?? null,
      credential_type: credentialType ?? null,
      wioa_approved: Boolean(wioaApproved),
      funding_eligible: Boolean(fundingEligible),
      next_start_date: nextStartDate ?? null,
      seats_available: seatsAvailable ? Number(seatsAvailable) : null,
      service_area: serviceArea ?? null,
      delivery_mode: deliveryMode ?? 'in_person',
      tenant_id: tenantId,
      published: false,
      is_active: false,
      status: 'pending_review',
    })
    .select('id, slug, title')
    .single();

  if (createError) return safeInternalError(createError, 'Failed to create program');

  // Submit for admin review via provider_program_approvals
  const { error: approvalError } = await supabase
    .from('provider_program_approvals')
    .insert({
      tenant_id: tenantId,
      program_id: program.id,
      status: 'pending',
      program_snapshot: { title: program.title, slug: program.slug },
    });

  // Non-fatal: program is created even if approval record fails
  if (approvalError) {
    console.warn('provider/programs/create: failed to create approval record', approvalError.message);
  }

  // Mark first_program_submitted onboarding step
  await supabase
    .from('provider_onboarding_steps')
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .eq('step', 'first_program_submitted')
    .eq('completed', false);

  return NextResponse.json({
    success: true,
    programId: program.id,
    slug: program.slug,
  }, { status: 201 });
}
