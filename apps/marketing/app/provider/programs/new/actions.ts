'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireProviderPortal } from '@/lib/auth/provider-access';

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || '').trim().slice(0, max);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export async function submitProviderProgram(formData: FormData) {
  const requestedTenant = text(formData, 'tenant', 64) || null;
  const access = await requireProviderPortal(requestedTenant);
  if (access.isPlatformAdmin && access.platformWide) redirect('/provider/dashboard');
  const tenantId = access.tenantId!;

  const title = text(formData, 'title', 200);
  const description = text(formData, 'description', 5000);
  const category = text(formData, 'category', 100) || 'workforce';
  const credentialName = text(formData, 'credential_name', 250) || null;
  const durationWeeksRaw = Number(text(formData, 'duration_weeks', 8) || 0);
  const seatsRaw = Number(text(formData, 'seats_available', 8) || 0);
  const slug = slugify(text(formData, 'slug', 160) || title);

  if (title.length < 3 || !slug) throw new Error('Program title and valid slug are required');

  const db = access.db;
  const { data: duplicate } = await db.from('programs').select('id').eq('tenant_id', tenantId).eq('slug', slug).maybeSingle();
  if (duplicate) throw new Error('A program with this slug already exists for this provider');

  const { data: program, error } = await db.from('programs').insert({
    tenant_id: tenantId,
    name: title,
    title,
    slug,
    description: description || null,
    category,
    credential_name: credentialName,
    duration_weeks: Number.isFinite(durationWeeksRaw) && durationWeeksRaw > 0 ? Math.round(durationWeeksRaw) : null,
    seats_available: Number.isFinite(seatsRaw) && seatsRaw >= 0 ? Math.round(seatsRaw) : null,
    status: 'pending_review',
    published: false,
    is_active: false,
  }).select('id, title, slug').single();

  if (error || !program) throw new Error('Program submission could not be created');

  const { error: approvalError } = await db.from('provider_program_approvals').insert({
    tenant_id: tenantId,
    program_id: program.id,
    status: 'submitted',
    submitted_by: access.user.id,
    program_snapshot: { title, slug, description, category, credential_name: credentialName },
  });
  if (approvalError) {
    await db.from('programs').delete().eq('id', program.id).eq('tenant_id', tenantId);
    throw new Error('Program approval submission could not be created');
  }

  const { error: onboardingError } = await db
    .from('provider_onboarding_steps')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: access.user.id,
    })
    .eq('tenant_id', tenantId)
    .eq('step', 'first_program_submitted');

  if (onboardingError) {
    // The program and its approval request are valid and must not be destroyed
    // merely because a derived onboarding marker failed. Surface the failure so
    // operations can repair it instead of silently reporting false completion.
    throw new Error(`Program submitted, but provider onboarding could not be updated: ${onboardingError.message}`);
  }

  revalidatePath('/provider/programs');
  revalidatePath('/provider/dashboard');
  const suffix = access.isPlatformAdmin ? `?tenant=${encodeURIComponent(tenantId)}` : '';
  redirect(`/provider/programs${suffix}`);
}
