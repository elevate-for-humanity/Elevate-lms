'use server';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export async function beginEmployerOnboarding(form: FormData) {
  const { user } = await requireRole(['admin', 'staff']);
  const id = String(form.get('applicationId') || '');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw new Error('Invalid employer application.');
  const db = await requireAdminClient();
  const { data: app, error } = await db
    .from('employer_applications')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !app) throw new Error('Employer application not found.');
  if (app.data?.employer_id) redirect(`/employers/${app.data.employer_id}`);
  if (
    !['pending', 'in_review'].includes(app.status) ||
    app.state === 'draft' ||
    !app.company_name ||
    !app.email ||
    /@example\.(com|org|net)$/i.test(app.email)
  )
    throw new Error('Verify this application and its contact details before onboarding.');
  // A deterministic ID makes retries safe without merging unrelated businesses
  // that happen to share an email. Existing employer status is never overwritten.
  const { error: createError } = await db.from('employers').upsert(
    {
      id,
      name: app.company_name,
      business_name: app.company_name,
      company_name: app.company_name,
      contact_name: app.contact_name,
      email: app.email,
      contact_email: app.email,
      phone: app.phone,
      contact_phone: app.phone,
      industry: app.data?.industry || null,
      status: 'pending',
      approved: false,
      notes: `Created from employer application ${id}; verification and onboarding required.`,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );
  if (createError) throw new Error('Unable to create pending employer. Application preserved.');
  const { data: updated, error: updateError } = await db
    .from('employer_applications')
    .update({
      status: 'in_review',
      updated_at: new Date().toISOString(),
      data: {
        ...(app.data || {}),
        employer_id: id,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      },
    })
    .eq('id', id)
    .eq('status', app.status)
    .select('id')
    .maybeSingle();
  if (updateError || !updated)
    throw new Error('Employer record saved, but application linking requires retry.');
  await logAdminAudit({
    action: AdminAction.APPLICATION_STATUS_CHANGED,
    actorId: user.id,
    entityType: 'employer_applications',
    entityId: id,
    metadata: {
      employer_id: id,
      previous_status: app.status,
      new_status: 'in_review',
      approved: false,
    },
  });
  redirect(`/employers/${id}`);
}
