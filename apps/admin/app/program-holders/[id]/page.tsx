import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Mail, Phone, ShieldCheck, Users, BookOpen, ArrowLeft } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Program Holder | Admin', robots: { index: false, follow: false } };

export default async function ProgramHolderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { profile } = await requireRole(['admin', 'staff']);
  const { id } = await params;
  const messages = await searchParams;
  const db = await requireAdminClient();

  const { data: holder, error } = await db
    .from('program_holders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !holder) notFound();

  const { data: assignments } = await db
    .from('program_holder_programs')
    .select('id, program_id, role_in_program, is_primary, status, created_at')
    .eq('program_holder_id', id)
    .order('created_at', { ascending: false });

  const programIds = (assignments ?? []).map((row: any) => row.program_id).filter(Boolean);
  const { data: programs } = programIds.length
    ? await db.from('programs').select('id, title, name, slug').in('id', programIds)
    : { data: [] as any[] };
  const programById = new Map((programs ?? []).map((program: any) => [program.id, program]));

  const { data: roster, error: rosterError } = await db
    .from('program_enrollments')
    .select('id,user_id,full_name,email,status,enrollment_state,program_id,enrolled_at,progress_percent,at_risk')
    .eq('program_holder_id', id)
    .order('enrolled_at', { ascending: false });
  const learners = roster ?? [];

  const canDecide = ['admin', 'super_admin'].includes(String(profile.role ?? ''));

  async function updateStatus(formData: FormData) {
    'use server';
    const { user: actor, profile: actorProfile } = await requireRole(['admin']);
    const nextStatus = String(formData.get('status') ?? '');
    if (!['active', 'rejected', 'suspended'].includes(nextStatus)) redirect(`/program-holders/${id}?error=Invalid+status`);
    if (!['admin', 'super_admin'].includes(String(actorProfile.role ?? ''))) redirect('/unauthorized');

    const adminDb = await requireAdminClient();
    const { error: updateError } = await adminDb
      .from('program_holders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) redirect(`/program-holders/${id}?error=Status+update+failed`);

    await adminDb.from('admin_audit_events').insert({
      action: `program_holder.${nextStatus}`,
      actor_user_id: actor.id,
      target_type: 'program_holder',
      target_id: id,
      metadata: { previous_status: holder.status },
    });
    redirect(`/program-holders/${id}?success=Status+updated`);
  }

  const displayName = holder.organization_name || holder.name || holder.contact_name || 'Program Holder';

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 px-6 py-8 text-white">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs dark items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Program Holders', href: '/program-holders' }, { label: displayName }]} />
          <Link href="/program-holders" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/90 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to program holders</Link>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-violet-100"><Building2 className="h-5 w-5" />Partner administration</div>
              <h1 className="mt-2 text-3xl font-black">{displayName}</h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-violet-50">Review organization access, assigned programs, and the current approval state from one workspace.</p>
            </div>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-black uppercase tracking-wide">{holder.status || 'pending'}</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-7">
        {messages.error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{messages.error}</div>}
        {messages.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{messages.success}</div>}

        <section className="grid gap-4 md:grid-cols-5">
          {[
            ['Organization', displayName, Building2],
            ['Programs', String(assignments?.length ?? 0), BookOpen],
            ['Learners', String(learners.length), Users],
            ['Contact email', holder.contact_email || 'Not provided', Mail],
            ['Contact phone', holder.contact_phone || 'Not provided', Phone],
          ].map(([label, value, Icon]) => {
            const CardIcon = Icon as typeof Building2;
            return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CardIcon className="h-5 w-5 text-violet-700" /><div className="mt-3 text-xs font-black uppercase tracking-wide text-slate-500">{String(label)}</div><div className="mt-1 break-words text-sm font-black text-slate-950">{String(value)}</div></div>;
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
            <div><h2 className="flex items-center gap-2 text-lg font-black text-slate-950"><Users className="h-5 w-5 text-violet-700" />Learner roster</h2><p className="mt-1 text-sm font-medium text-slate-600">Learners connected through canonical program enrollments.</p></div>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-900">{learners.length} learner{learners.length === 1 ? '' : 's'}</span>
          </div>
          {rosterError ? <p className="p-6 text-sm font-bold text-rose-700">The learner roster could not be loaded.</p> : learners.length ? (
            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600"><tr><th className="px-5 py-3">Learner</th><th className="px-5 py-3">Program</th><th className="px-5 py-3">State</th><th className="px-5 py-3">Progress</th><th className="px-5 py-3">Enrolled</th></tr></thead><tbody className="divide-y divide-slate-100">{learners.map((learner: any) => {
              const program = programById.get(learner.program_id) as any;
              return <tr key={learner.id} className={learner.at_risk ? 'bg-amber-50' : 'bg-white'}><td className="px-5 py-4"><Link href={`/students/${learner.user_id}`} className="font-black text-brand-blue-700 hover:underline">{learner.full_name || learner.email || 'Learner'}</Link><p className="mt-1 text-xs text-slate-500">{learner.email || 'No email recorded'}</p></td><td className="px-5 py-4 font-semibold text-slate-800">{program?.title || program?.name || 'Program'}</td><td className="px-5 py-4 capitalize text-slate-700">{String(learner.enrollment_state || learner.status || 'unknown').replaceAll('_', ' ')}</td><td className="px-5 py-4 font-bold text-slate-800">{Number(learner.progress_percent || 0)}%</td><td className="px-5 py-4 text-slate-600">{learner.enrolled_at ? new Date(learner.enrolled_at).toLocaleDateString() : '—'}</td></tr>;
            })}</tbody></table></div>
          ) : <p className="p-8 text-center text-sm font-semibold text-slate-500">No learners are currently assigned to this Program Holder.</p>}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-indigo-700" /><h2 className="text-lg font-black text-slate-950">Assigned programs</h2></div>
            <div className="mt-4 space-y-3">
              {(assignments ?? []).length ? (assignments ?? []).map((assignment: any) => {
                const program = programById.get(assignment.program_id) as any;
                return <div key={assignment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="font-black text-slate-950">{program?.title || program?.name || 'Program'}</div><div className="mt-1 text-xs font-semibold text-slate-500">{assignment.role_in_program || 'Program holder'} · {assignment.status || 'active'}</div></div>;
              }) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">No programs assigned yet.</div>}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
              <div className="flex items-center gap-2 font-black text-indigo-950"><ShieldCheck className="h-5 w-5" />Reviewer direction</div>
              <ol className="mt-3 space-y-2 text-sm font-medium text-indigo-950"><li>1. Verify organization and contact details.</li><li>2. Confirm the correct programs are assigned.</li><li>3. Approve only when access and program ownership are verified.</li><li>4. Suspend or reject access when requirements are not met.</li></ol>
            </div>

            {canDecide && (
              <form action={updateStatus} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <label className="text-sm font-black text-slate-900">Change status
                  <select name="status" defaultValue={holder.status || 'active'} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold">
                    <option value="active">Active</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option>
                  </select>
                </label>
                <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-800"><Users className="h-4 w-4" />Save status</button>
              </form>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
