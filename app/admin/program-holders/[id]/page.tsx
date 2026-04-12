import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import {

  User, Mail, Phone, Calendar,
  FileText, BookOpen, ArrowLeft, ShieldAlert, AlertTriangle,
} from 'lucide-react';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Program Holder | Admin',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}

type AdminRole = 'admin' | 'super_admin' | 'staff';

function canApprove(role: AdminRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

/** Re-verify caller is admin/super_admin. Returns caller ID + admin client, or redirects with error. */
async function verifyApprovalCaller(holderId: string): Promise<{ callerId: string; adb: SupabaseClient }> {
  const supa = await createClient();
  const adb = await getAdminClient();
  const sdb = adb;

  const { data: { user: caller } } = await supa.auth.getUser();
  if (!caller) {
    redirect(`/admin/program-holders/${holderId}?error=${encodeURIComponent('Session expired')}`);
  }

  const { data: callerProfile } = await sdb
    .from('profiles')
    .select('role')
    .eq('id', caller.id)
    .single();

  if (!callerProfile || !canApprove(callerProfile.role as AdminRole)) {
    redirect(`/admin/program-holders/${holderId}?error=${encodeURIComponent('Approval requires admin or super_admin role')}`);
  }

  if (!adb) {
    redirect(`/admin/program-holders/${holderId}?error=${encodeURIComponent('Database not configured')}`);
  }

  return { callerId: caller.id, adb };
}

export default async function AdminProgramHolderDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error: pageError, success: pageSuccess } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/program-holders');

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const viewRoles: AdminRole[] = ['admin', 'super_admin', 'staff'];
  if (!adminProfile || !viewRoles.includes(adminProfile.role as AdminRole)) {
    redirect('/unauthorized');
  }

  const adminRole = adminProfile.role as AdminRole;
  const hasApprovalAuthority = canApprove(adminRole);

  // Fetch program holder
  const { data: holder, error } = await supabase
    .from('program_holders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !holder) notFound();

  // Fetch assigned programs
  const { data: assignments } = await supabase
    .from('program_holder_programs')
    .select('id, program_id, role_in_program, is_primary, status, created_at')
    .eq('program_holder_id', id);

  const assignedProgramIds = (assignments || []).map((a: any) => a.program_id);

  // Fetch program details for assigned programs
  const { data: assignedPrograms } = assignedProgramIds.length > 0
    ? await supabase.from('programs').select('id, name, title, slug').in('id', assignedProgramIds)
    : { data: [] };

  const programMap: Record<string, any> = {};
  (assignedPrograms || []).forEach((p: any) => { programMap[p.id] = p; });

  // Fetch all active programs for dropdowns
  const { data: allPrograms } = await supabase
    .from('programs')
    .select('id, name, title, slug, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true });

  const unassignedPrograms = (allPrograms || []).filter(
    (p: any) => !assignedProgramIds.includes(p.id)
  );

  // Fetch linked user profile
  const { data: holderProfile } = holder.user_id
    ? await supabase.from('profiles').select('id, email, full_name, role').eq('id', holder.user_id).maybeSingle()
    : { data: null };

  // Fetch audit events for this holder
  const { data: auditEvents } = await supabase
    .from('admin_audit_events')
    .select('action, actor_user_id, metadata, created_at')
    .eq('target_type', 'program_holder')
    .eq('target_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  const isPending = holder.status === 'pending';
  const isActive = holder.status === 'active';
  const isInactive = holder.status === 'rejected' || holder.status === 'suspended';
  const hasLinkedUser = !!holder.user_id;
  const assignmentCount = (assignments || []).length;

  // ── Server actions (all use RPC for atomicity) ──

  async function approveAndProvision(formData: FormData) {
    'use server';
    const programId = formData.get('program_id') as string;
    if (!programId) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent('Program selection is required')}`);
    }

    const { callerId, adb } = await verifyApprovalCaller(id);

    const { data, error: rpcError } = await adb
      .rpc('approve_and_provision_program_holder', {
        p_holder_id: id,
        p_program_id: programId,
        p_actor_id: callerId,
      });

    if (rpcError) {
      logger.error('[PH Approve RPC] Database error', { id, error: rpcError });
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(rpcError.message || 'Database error during approval')}`);
    }

    if (data && !data.success) {
      logger.warn('[PH Approve RPC] Validation failed', { id, result: data });
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(data.error || 'Approval validation failed')}`);
    }

    logger.info('[PH Approve] Success via RPC', { holderId: id, programId, approvedBy: callerId });

    // Send approval notification email (non-blocking)
    try {
      const { data: holderData } = await adb
        .from('program_holders')
        .select('contact_email, contact_name, organization_name')
        .eq('id', id)
        .maybeSingle();

      const { data: programData } = await adb
        .from('programs')
        .select('name')
        .eq('id', programId)
        .maybeSingle();

      if (holderData?.contact_email) {
        const { sendProgramHolderApprovalEmail } = await import('@/lib/email/sendgrid');
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
        await sendProgramHolderApprovalEmail({
          email: holderData.contact_email,
          name: holderData.contact_name || holderData.organization_name || 'Partner',
          organizationName: holderData.organization_name || 'Your Organization',
          programName: programData?.name || 'Your Program',
          portalUrl: `${siteUrl}/program-holder/dashboard`,
        });
        logger.info('[PH Approve] Notification email sent', { email: holderData.contact_email });
      }
    } catch (emailErr) {
      logger.warn('[PH Approve] Email notification failed (non-critical)', emailErr);
    }

    redirect(`/admin/program-holders/${id}?success=${encodeURIComponent('Holder approved and program provisioned')}`);
  }

  async function rejectHolder() {
    'use server';
    const { callerId, adb } = await verifyApprovalCaller(id);

    const { error: updateErr, count } = await adb
      .from('program_holders')
      .update({ status: 'rejected' })
      .eq('id', id)
      .eq('status', 'pending'); // optimistic concurrency

    if (updateErr) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(updateErr.message || 'Failed to reject')}`);
    }

    // Audit event
    await adb.from('admin_audit_events').insert({
      action: 'program_holder.rejected',
      actor_user_id: callerId,
      target_type: 'program_holder',
      target_id: id,
      metadata: {},
    });

    logger.info('[PH Reject]', { holderId: id, rejectedBy: callerId });
    redirect(`/admin/program-holders/${id}?success=${encodeURIComponent('Holder rejected')}`);
  }

  async function suspendHolder() {
    'use server';
    const { callerId, adb } = await verifyApprovalCaller(id);

    const { error: updateErr } = await adb
      .from('program_holders')
      .update({ status: 'suspended' })
      .eq('id', id)
      .eq('status', 'active'); // optimistic concurrency

    if (updateErr) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(updateErr.message || 'Failed to suspend')}`);
    }

    await adb.from('admin_audit_events').insert({
      action: 'program_holder.suspended',
      actor_user_id: callerId,
      target_type: 'program_holder',
      target_id: id,
      metadata: {},
    });

    logger.info('[PH Suspend]', { holderId: id, suspendedBy: callerId });
    redirect(`/admin/program-holders/${id}?success=${encodeURIComponent('Holder suspended')}`);
  }

  async function provisionProgram(formData: FormData) {
    'use server';
    const programId = formData.get('program_id') as string;
    if (!programId) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent('Program selection is required')}`);
    }

    const { callerId, adb } = await verifyApprovalCaller(id);

    const { data, error: rpcError } = await adb
      .rpc('provision_additional_program', {
        p_holder_id: id,
        p_program_id: programId,
        p_actor_id: callerId,
      });

    if (rpcError) {
      logger.error('[PH Provision RPC] Database error', { id, programId, error: rpcError });
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(rpcError.message || 'Database error during provisioning')}`);
    }

    if (data && !data.success) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(data.error || 'Provisioning validation failed')}`);
    }

    redirect(`/admin/program-holders/${id}?success=${encodeURIComponent('Program provisioned')}`);
  }

  async function removeProgram(formData: FormData) {
    'use server';
    const assignmentId = formData.get('assignment_id') as string;
    if (!assignmentId) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent('Assignment ID is required')}`);
    }

    const { callerId, adb } = await verifyApprovalCaller(id);

    const { data, error: rpcError } = await adb
      .rpc('deprovision_program', {
        p_assignment_id: assignmentId,
        p_actor_id: callerId,
      });

    if (rpcError) {
      logger.error('[PH Deprovision RPC] Database error', { id, assignmentId, error: rpcError });
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(rpcError.message || 'Database error during deprovisioning')}`);
    }

    if (data && !data.success) {
      redirect(`/admin/program-holders/${id}?error=${encodeURIComponent(data.error || 'Deprovisioning failed')}`);
    }

    redirect(`/admin/program-holders/${id}?success=${encodeURIComponent('Program removed')}`);
  }

  const statusColor: Record<string, string> = {
    active: 'bg-brand-green-100 text-brand-green-800 border-brand-green-200',
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    rejected: 'bg-brand-red-100 text-brand-red-800 border-brand-red-200',
    suspended: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-4">
          <Breadcrumbs items={[
            { label: 'Admin', href: '/admin/dashboard' },
            { label: 'Program Holders', href: '/admin/program-holders' },
            { label: holder.organization_name || holder.name || 'Detail' },
          ]} />
        </div>

        <Link href="/admin/program-holders" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to list
        </Link>

        {/* Flash messages */}
        {pageError && (
          <div className="mb-4 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3 text-sm text-brand-red-800">
            <strong>Error:</strong> {pageError}
          </div>
        )}
        {pageSuccess && (
          <div className="mb-4 bg-brand-green-50 border border-brand-green-200 rounded-lg p-3 text-sm text-brand-green-800">
            {pageSuccess}
          </div>
        )}

        {/* Header + Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {holder.organization_name || holder.name || 'Unnamed Organization'}
              </h1>
              <span className={`inline-block mt-2 text-xs font-medium px-3 py-1 rounded border ${statusColor[holder.status] || 'bg-gray-100 text-gray-600'}`}>
                {holder.status?.toUpperCase()}
              </span>
            </div>

            <div className="flex gap-2">
              {hasApprovalAuthority && isActive && (
                <form action={suspendHolder}>
                  <button type="submit" className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition">
                    Suspend
                  </button>
                </form>
              )}
              {hasApprovalAuthority && isPending && (
                <form action={rejectHolder}>
                  <button type="submit" className="px-4 py-2 bg-brand-red-600 text-white text-sm font-medium rounded-lg hover:bg-brand-red-700 transition">
                    Reject
                  </button>
                </form>
              )}
              {!hasApprovalAuthority && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <span>Review only — approval requires admin or super_admin role</span>
                </div>
              )}
            </div>
          </div>

          {/* Integrity warnings */}
          {!hasLinkedUser && (
            <div className="mt-4 bg-brand-red-50 border border-brand-red-200 rounded-lg p-3 text-sm text-brand-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Missing linked user.</strong> This holder has no user_id — approval is blocked until a user account is linked.
              </div>
            </div>
          )}

          {/* Details grid */}
          <dl className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <dt className="text-gray-500">Contact:</dt>
              <dd className="font-medium">{holder.contact_name || '—'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <dt className="text-gray-500">Email:</dt>
              <dd className="font-medium">{holder.contact_email || '—'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <dt className="text-gray-500">Phone:</dt>
              <dd className="font-medium">{holder.contact_phone || '—'}</dd>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <dt className="text-gray-500">Applied:</dt>
              <dd className="font-medium">{new Date(holder.created_at).toLocaleDateString()}</dd>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <dt className="text-gray-500">MOU:</dt>
              <dd className="font-medium">{holder.mou_signed ? 'Signed' : 'Not signed'}</dd>
            </div>
            {holderProfile && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <dt className="text-gray-500">Account:</dt>
                <dd className="font-medium">{holderProfile.email} ({holderProfile.role})</dd>
              </div>
            )}
            {holder.approved_by && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <dt className="text-gray-500">Approved by:</dt>
                <dd className="font-medium">{holder.approved_by}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* ── PENDING: Approve & Provision (atomic RPC) ── */}
        {(isPending || isInactive) && hasApprovalAuthority && hasLinkedUser && (
          <div className="bg-white rounded-lg shadow-sm border-2 border-amber-300 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {isPending ? 'Approve & Provision' : 'Reactivate & Provision'}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the primary program this holder will manage. Approval and program provisioning execute as a single database transaction — the holder cannot be activated without a program.
            </p>

            {unassignedPrograms.length > 0 ? (
              <form action={approveAndProvision} className="space-y-4">
                <div>
                  <label htmlFor="approve_program_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Primary program to provision
                  </label>
                  <select
                    name="program_id"
                    id="approve_program_id"
                    required
                    defaultValue=""
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-green-500 focus:border-brand-green-500"
                  >
                    <option value="" disabled>Select a program...</option>
                    {unassignedPrograms.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name || p.title} ({p.slug})
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-green-600 text-white text-sm font-semibold rounded-lg hover:bg-brand-green-700 transition"
                >
                  {isPending ? 'Approve & Provision Program' : 'Reactivate & Provision Program'}
                </button>
              </form>
            ) : (
              <div className="bg-brand-red-50 border border-brand-red-200 rounded-lg p-3 text-sm text-brand-red-800">
                No active programs available to provision. Create a program first.
              </div>
            )}
          </div>
        )}

        {/* ── Provisioned Programs ── */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-blue-600" />
            Provisioned Programs
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Each program grants scoped access to student records, grades, and analytics for that program only.
          </p>

          {assignmentCount > 0 ? (
            <div className="space-y-3 mb-6">
              {(assignments || []).map((a: any) => {
                const prog = programMap[a.program_id];
                return (
                  <div key={a.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {prog?.name || prog?.title || a.program_id}
                        {a.is_primary && (
                          <span className="ml-2 text-xs bg-brand-blue-100 text-brand-blue-700 px-2 py-0.5 rounded">Primary</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">Role: {a.role_in_program} | Since {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    {hasApprovalAuthority && (
                      <form action={removeProgram}>
                        <input type="hidden" name="assignment_id" value={a.id} />
                        <button type="submit" className="text-xs text-brand-red-600 hover:underline">Remove</button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-800 text-sm font-medium">No programs provisioned</p>
              <p className="text-amber-600 text-xs mt-1">
                {isPending
                  ? 'Use the approval form above to activate this holder with a primary program.'
                  : 'This holder cannot access the portal until at least one program is provisioned.'}
              </p>
            </div>
          )}

          {/* Additional provisioning — only for active holders */}
          {isActive && hasApprovalAuthority && unassignedPrograms.length > 0 && (
            <form action={provisionProgram} className="flex items-end gap-3 pt-4 border-t">
              <div className="flex-1">
                <label htmlFor="provision_program_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Provision additional program
                </label>
                <select
                  name="program_id"
                  id="provision_program_id"
                  required
                  defaultValue=""
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-blue-500 focus:border-brand-blue-500"
                >
                  <option value="" disabled>Select a program to provision...</option>
                  {unassignedPrograms.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title} ({p.slug})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-blue-600 text-white text-sm font-medium rounded-lg hover:bg-brand-blue-700 transition whitespace-nowrap"
              >
                Provision Program
              </button>
            </form>
          )}

          {!hasApprovalAuthority && unassignedPrograms.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">Program provisioning requires admin or super_admin role.</p>
          )}
        </div>

        {/* Audit Trail */}
        {(auditEvents || []).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h2>
            <div className="space-y-2">
              {(auditEvents || []).map((evt: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-400 whitespace-nowrap text-xs mt-0.5">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                  <div>
                    <span className="font-medium text-gray-700">{evt.action.replace('program_holder.', '')}</span>
                    {evt.metadata?.program_name && (
                      <span className="text-gray-500"> — {evt.metadata.program_name}</span>
                    )}
                    <p className="text-xs text-gray-400">by {evt.actor_user_id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MOU section */}
        {isActive && !holder.mou_signed && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">MOU</h2>
            <p className="text-sm text-gray-600 mb-4">This holder has not signed the MOU yet.</p>
            <Link
              href={`/admin/program-holders/${id}/countersign-mou`}
              className="text-sm text-brand-blue-600 hover:underline font-medium"
            >
              Go to MOU management →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
